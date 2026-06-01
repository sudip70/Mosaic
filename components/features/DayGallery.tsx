import { FlatList, Dimensions } from 'react-native';
import { Image } from 'react-native';
import type { Photo } from '@/types';

const { width } = Dimensions.get('window');

interface DayGalleryProps {
  photos: Photo[];
}

export function DayGallery({ photos }: DayGalleryProps) {
  return (
    <FlatList
      data={photos}
      keyExtractor={(p) => p.id}
      horizontal
      pagingEnabled
      showsHorizontalScrollIndicator={false}
      initialNumToRender={1}
      windowSize={3}
      maxToRenderPerBatch={2}
      renderItem={({ item }) => (
        <Image
          source={item.url ? { uri: item.url } : undefined}
          style={{ width, height: width }}
          resizeMode="cover"
        />
      )}
    />
  );
}
