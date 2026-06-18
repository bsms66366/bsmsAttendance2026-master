import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Platform,
} from 'react-native';

import { EvilIcons } from '@expo/vector-icons';

import { formatDistanceToNowStrict } from 'date-fns';
import locale from 'date-fns/locale/en-US';
import formatDistance from '../helpers/formatDistanceCustom';
import { useNavigation } from '@react-navigation/core';

export default function RenderItem({ item: placements }) {
  const navigation = useNavigation();

  function gotoProfile(user) {
    navigation.navigate('Profile Screen', {
      userId: user,
    });
  }

  function gotoSingleplacements(placementsId) {
    navigation.navigate('placementsScreen', {
      placementsId: placementsId,
    });
  }

  return (
    <View style={styles.placementsContainer}>
      <TouchableOpacity onPress={() => gotoProfile(user.id)}>
        <Image
          style={styles.avatar}
          source={{
            uri: placements.user.avatar,
          }}
        />
      </TouchableOpacity>
      <View style={{ flex: 1 }}>
        <TouchableOpacity
          style={styles.flexRow}
          onPress={() => gotoSingleplacements(placements.id)}
        >
          <Text numberOfLines={1} style={styles.placementsName}>
            {placements.user.name}
          </Text>
          <Text numberOfLines={1} style={styles.placementsHandle}>
            @{placements.user.username}
          </Text>
          <Text>&middot;</Text>
          <Text numberOfLines={1} style={styles.placementsHandle}>
            {/* {formatDistanceToNowStrict(new Date(placements.created_at))} */}
            {formatDistanceToNowStrict(new Date(placements.created_at), {
              locale: {
                ...locale,
                formatDistance,
              },
            })}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.placementsContentContainer}
          onPress={() => gotoSingleplacements(placements.id)}
        >
          <Text style={styles.placementsContent}>{placements.body}</Text>
        </TouchableOpacity>

        <View style={styles.placementsEngagement}>
          <TouchableOpacity style={styles.flexRow}>
            <EvilIcons
              name="comment"
              size={22}
              color="gray"
              style={{ marginRight: 2 }}
            />
            <Text style={styles.textGray}>456</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.flexRow, styles.ml4]}>
            <EvilIcons
              name="redo placements"
              size={22}
              color="gray"
              style={{ marginRight: 2 }}
            />
            <Text style={styles.textGray}>32</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.flexRow, styles.ml4]}>
            <EvilIcons
              name="heart"
              size={22}
              color="gray"
              style={{ marginRight: 2 }}
            />
            <Text style={styles.textGray}>4,456</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.flexRow, styles.ml4]}>
            <EvilIcons
              name={Platform.OS === 'ios' ? 'share-apple' : 'share-google'}
              size={22}
              color="gray"
              style={{ marginRight: 2 }}
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flexRow: {
    flexDirection: 'row',
  },
  placementsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  avatar: {
    width: 42,
    height: 42,
    marginRight: 8,
    borderRadius: 21,
  },
  placementsName: {
    fontWeight: 'bold',
    color: '#222222',
  },
  placementsHandle: {
    marginHorizontal: 8,
    color: 'gray',
  },
  placementsContentContainer: {
    marginTop: 4,
  },
  placementsContent: {
    lineHeight: 20,
  },
  textGray: {
    color: 'gray',
  },
  placementsEngagement: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  ml4: {
    marginLeft: 16,
  },
});
