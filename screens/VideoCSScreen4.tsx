import * as WebBrowser from "expo-web-browser";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { useThemeColor } from "@/components/Themed";
import axiosConfig from "../helpers/axiosConfig";

type VideoItem = {
  id: number;
  name: string;
  video: string;
};

export default function App() {
  const [isLoading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<VideoItem[]>([]);

  const backgroundColor = useThemeColor({}, 'background');
  const headingColor = useThemeColor({}, 'heading');
  const accentColor = useThemeColor({}, 'accent');
  const buttonTextColor = useThemeColor({}, 'buttonText');

  useEffect(() => {
    axiosConfig
      .get("/Video/")
      .then((response) => {
        console.log(response.data);
        setData(response.data as VideoItem[]);
      })
      .catch((error: unknown) => console.error(error))
      .finally(() => setLoading(false));
  }, []);

  return (
    <View style={{ flex: 1, padding: 24, backgroundColor }}>
      <Text
        style={{
          color: headingColor,
          fontSize: 20,
          marginTop: 10,
          marginBottom: 15,
          textAlign: "center",
        }}
      >
        CLINICAL SKILLS VIDEOS
      </Text>
      {isLoading ? (
        <ActivityIndicator />
      ) : (
        <FlatList<VideoItem>
          data={data}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => {
            console.log("item", item);
            return (
              <TouchableOpacity
                onPress={() => WebBrowser.openBrowserAsync(item.video)}
              >
                <Text
                  style={{
                    flex: 1,
                    backgroundColor: accentColor,
                    borderRadius: 20,
                    overflow: 'hidden',
                    padding: 8,
                    marginVertical: 5,
                    marginHorizontal: 8,
                    marginBottom: 15,
                  }}
                >
                  {item.name}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
}
