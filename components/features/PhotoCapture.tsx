import { View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Button } from '@/components/ui/Button';
import { Typography } from '@/components/ui/Typography';
import { useUpload } from '@/hooks/useUpload';
import { useAuth } from '@/hooks/useAuth';
import { today } from '@/lib/dates';
import { useColorStore } from '@/store/useColorStore';

export function PhotoCapture() {
  const { user } = useAuth();
  const { uploadPhoto, uploading, error } = useUpload();
  const todayColor = useColorStore((s) => s.todayColor);

  // Color not yet loaded — block capture to avoid silent no-ops.
  const canCapture = !!user && !!todayColor;

  async function pickFromLibrary() {
    if (!canCapture) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: false,
    });
    if (!result.canceled) {
      await uploadPhoto(result.assets[0].uri, user.id, today(), todayColor.id);
    }
  }

  async function openCamera() {
    if (!canCapture) return;
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (!result.canceled) {
      await uploadPhoto(result.assets[0].uri, user.id, today(), todayColor.id);
    }
  }

  return (
    <View className="gap-3 px-5">
      <View className="flex-row gap-3">
        <Button
          label="Camera"
          onPress={openCamera}
          loading={uploading}
          disabled={!canCapture}
        />
        <Button
          label="Library"
          onPress={pickFromLibrary}
          variant="secondary"
          loading={uploading}
          disabled={!canCapture}
        />
      </View>
      {error && (
        <Typography variant="caption" className="text-red-500 text-center">
          {error}
        </Typography>
      )}
    </View>
  );
}
