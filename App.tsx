import React, { useState } from 'react';
import { View, Text, Button, StyleSheet, Alert, ScrollView, ImageBackground } from 'react-native';
import DocumentPicker, { DocumentPickerResponse } from 'react-native-document-picker';

const App = () => {
  const [filePath, setFilePath] = useState<string | null>(null);
  const [transcription, setTranscription] = useState<string>('');

  const handleFileSelectionAndUpload = async () => {
    try {
      // Sélectionner le fichier
      const res: DocumentPickerResponse[] = await DocumentPicker.pick({
        type: [DocumentPicker.types.audio],
      });
      const file = res[0];
      setFilePath(file.uri);

      // Télécharger le fichier
      const fileName = file.uri.split('/').pop();
      const uploadUrl = 'https://180b-197-0-160-111.ngrok-free.app/upload'; // Remplacez par votre URL Ngrok

      const fileToUpload = {
        uri: file.uri,
        name: fileName || 'audiofile',
        type: 'audio/wav', // Assurez-vous que le type MIME est correct
      };

      const formData = new FormData();
      formData.append('file', fileToUpload);

      const response = await fetch(uploadUrl, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.ok) {
        const responseData = await response.json();
        setTranscription(responseData.transcription || 'Transcription not available');
        Alert.alert('Success', 'File uploaded successfully');
      } else {
        const errorText = await response.text();
        Alert.alert('Error', `File upload failed: ${errorText}`);
      }
    } catch (err) {
      console.error(err);
      if (DocumentPicker.isCancel(err)) {
        Alert.alert('Cancelled', 'No file selected');
      } else {
        Alert.alert('Error', `Unknown error: ${JSON.stringify(err)}`);
      }
    }
  };

  return (
    <ImageBackground
      source={{ uri: 'https://i.pinimg.com/564x/40/5c/5f/405c5f12ac1edf431a4fb8b67ce2d3e2.jpg' }}
      style={styles.background}
    >
      <View style={styles.container}>
        <Text style={styles.title}>Upload Audio File</Text>
        <Button title="Choisir votre audio" onPress={handleFileSelectionAndUpload} />
        
        <ScrollView style={styles.transcriptionContainer}>
          <Text style={styles.transcriptionText}>{transcription}</Text>
        </ScrollView>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    resizeMode: 'cover',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 20,
    marginBottom: 20,
  },
  filePath: {
    marginVertical: 10,
    textAlign: 'center',
  },
  transcriptionContainer: {
    width: '80%',
    backgroundColor: '#f0f0f0',
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 10,
    maxHeight: 200,
    overflow: 'scroll',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    padding: 20,
    marginTop: 20,
  },
  transcriptionText: {
    margin: 0,
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    fontSize: 18,
    lineHeight: 24,
    color: '#555',
  },
});

export default App;