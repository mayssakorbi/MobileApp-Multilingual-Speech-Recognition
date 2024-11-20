from io import BytesIO
from fastapi import FastAPI, File, UploadFile
from fastapi.responses import JSONResponse
from pydub import AudioSegment
import torch
from transformers import WhisperForConditionalGeneration, WhisperProcessor
from peft import PeftConfig, PeftModel
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Configurer CORS (Cross-Origin Resource Sharing) pour permettre les requêtes de l'application React Native
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Vous pouvez restreindre les origines en spécifiant une liste d'URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

model_id = "kawther1/whisperlargeev2"
language = "ar"
task = "transcribe"

class Transcriber:
    def __init__(self, model_id, language, task):
        self.peft_config = PeftConfig.from_pretrained(model_id)
        self.base_model_name_or_path = self.peft_config.base_model_name_or_path
        self.model = WhisperForConditionalGeneration.from_pretrained(self.base_model_name_or_path)
        self.model = PeftModel.from_pretrained(self.model, model_id, language=language, task=task)
        self.processor = WhisperProcessor.from_pretrained(self.base_model_name_or_path, language=language, task=task)
        self.tokenizer = self.processor.tokenizer
        if self.tokenizer.pad_token is None:
            self.tokenizer.pad_token = self.tokenizer.eos_token

    def transcribe(self, audio_data):
        try:
            audio = AudioSegment.from_file(BytesIO(audio_data))
            audio = audio.set_frame_rate(16000).set_channels(1)
            audio_array = audio.get_array_of_samples()

            inputs = self.processor(audio_array, sampling_rate=16000, return_tensors="pt", return_attention_mask=True)
            input_features = inputs.input_features.to(torch.float32)
            attention_mask = inputs.attention_mask

            with torch.no_grad():
                predicted_ids = self.model.generate(
                    input_features,
                    attention_mask=attention_mask,
                    pad_token_id=self.tokenizer.pad_token_id,
                    max_new_tokens=448 - len(input_features[0]),
                    do_sample=True
                )
           
            transcription = self.processor.batch_decode(predicted_ids, skip_special_tokens=True)[0]
            return transcription
        except Exception as e:
            return str(e)

transcriber = Transcriber(model_id, language, task)

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        if file.content_type.startswith("audio/"):
            transcription = transcriber.transcribe(contents)
            return JSONResponse({"transcription": transcription})
        else:
            return JSONResponse({"error": "Invalid file type. Please upload an audio file."}, status_code=400)
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)