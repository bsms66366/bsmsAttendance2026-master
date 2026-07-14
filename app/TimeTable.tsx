import React, { useEffect, useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";

interface TimetableItem {
  module: string;
  day: string;
  time: string;
  location: string;
}

export default function TimetableScreen() {
  const [timetable, setTimetable] = useState<TimetableItem[]>([]);

  useEffect(() => {
    fetchTimetable();
  }, []);

  const fetchTimetable = async () => {
    try {
      const res = await fetch("https://timetablego.brighton.ac.uk/CMISGo/Web/Timetable");
      const data = await res.json();
      setTimetable(data);
    } catch (err) {
      console.error(err);
    }
  };

  const renderItem = ({ item }: { item: TimetableItem }) => (
    <View style={styles.card}>
      <Text style={styles.module}>{item.module}</Text>
      <Text>{item.day} • {item.time}</Text>
      <Text>{item.location}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={timetable}
        keyExtractor={(item, index) => index.toString()}
        renderItem={renderItem}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  card: {
    padding: 12,
    marginBottom: 10,
    backgroundColor: "#eee",
    borderRadius: 8,
  },
  module: {
    fontWeight: "bold",
    fontSize: 16,
  },
});