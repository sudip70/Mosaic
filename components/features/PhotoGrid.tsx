import { FlatList, View } from 'react-native';
import { PhotoTile } from '@/components/ui/PhotoTile';
import { EmptyState } from '@/components/ui/EmptyState';
import type { Photo } from '@/types';

interface PhotoGridProps {
  photos: Photo[];
  onPhotoPress?: (photo: Photo) => void;
}

export function PhotoGrid({ photos, onPhotoPress }: PhotoGridProps) {
  if (photos.length === 0) {
    return (
      <EmptyState
        title="No photos yet"
        subtitle="Capture today's color to get started"
      />
    );
  }

  return (
    <FlatList
      data={photos}
      keyExtractor={(p) => p.id}
      numColumns={3}
      renderItem={({ item }) => (
        <View className="p-0.5">
          <PhotoTile
            url={item.url ?? ''}
            onPress={() => onPhotoPress?.(item)}
          />
        </View>
      )}
    />
  );
}
