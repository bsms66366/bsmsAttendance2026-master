import { useThemeColor } from "@/components/Themed";
import { format } from "date-fns";
import { useContext, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AuthContext } from "../context/AuthProvider";

export default function ProfileScreen({ route, navigation }) {
  const [data, setData] = useState([]);
  const [isLoadingTweets, setIsLoadingTweets] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [isAtEndOfScrolling, setIsAtEndOfScrolling] = useState(false);
  const { user } = useContext(AuthContext);
  const isLoading = !user;

  const backgroundColor = useThemeColor({}, "background");
  const headingColor = useThemeColor({}, "heading");
  const textColor = useThemeColor({}, "text");
  const cardColor = useThemeColor({}, "card");
  const borderColor = useThemeColor({}, "border");
  const accentColor = useThemeColor({}, "accent");
  const primaryColor = useThemeColor({}, "primary");

  function handleRefresh() {
    setPage(1);
    setIsAtEndOfScrolling(false);
    setIsRefreshing(false);
  }

  function handleEnd() {
    setPage(page + 1);
  }

  /* async function getGLocation() {
    console.log('calling stuff')
    axios.get('https://placements.bsms.ac.uk/api/locations2025')
    .then(({ data}) => {
      console.log(data);
      })
      .catch((error) => console.error(error))
      .finally(() => setLoading(false));
    
} []; */

  const ProfileHeader = () => {
    // Debug: Log GP Teacher data
    if (user) {
      console.log("GP Teacher Debug:", {
        gp_teacher_obj: user.gp_teacher_obj,
        gp_teacher: user.gp_teacher,
        gp_teacher_obj_name: user.gp_teacher_obj?.name,
      });
    }

    return (
      <View style={{ backgroundColor }}>
        {isLoading || !user ? (
          <ActivityIndicator
            style={{ marginTop: 8 }}
            size="large"
            color="gray"
          />
        ) : (
          <View>
            <View
              style={[
                styles.backgroundImage,
                { backgroundColor: primaryColor },
              ]}
            />
            <View style={styles.avatarContainer}>
              <Image
                style={[styles.avatar, { borderColor: accentColor }]}
                source={require("../assets/images/profile.png")}
              />
            </View>

            <View style={styles.nameContainer}>
              <Text style={[styles.profileHandle, { color: textColor }]}>
                {user?.name || "N/A"}
              </Text>
              <Text style={[styles.profileHandle, { color: textColor }]}>
                {user?.bsms_id || "N/A"}
              </Text>
              <Text style={[styles.profileHandle, { color: textColor }]}>
                @{user?.email || "N/A"}
              </Text>
            </View>

            <View
              style={[
                styles.profileContainer,
                { backgroundColor: cardColor, borderColor: borderColor },
              ]}
            >
              <Text style={[styles.profileContainerText, { color: textColor }]}>
                <Text style={{ color: accentColor, fontWeight: "600" }}>
                  Student Number:
                </Text>{" "}
                {user?.student_number || "N/A"}
              </Text>
              <Text style={[styles.profileContainerText, { color: textColor }]}>
                <Text style={{ color: accentColor, fontWeight: "600" }}>
                  Year:
                </Text>{" "}
                {user?.year || "N/A"}
              </Text>
              <Text style={[styles.profileContainerText, { color: textColor }]}>
                <Text style={{ color: accentColor, fontWeight: "600" }}>
                  Age:
                </Text>{" "}
                {user?.age || "N/A"}
              </Text>
              <Text style={[styles.profileContainerText, { color: textColor }]}>
                <Text style={{ color: accentColor, fontWeight: "600" }}>
                  Gender:
                </Text>{" "}
                {user?.gender || "N/A"}
              </Text>
              <Text style={[styles.profileContainerText, { color: textColor }]}>
                <Text style={{ color: accentColor, fontWeight: "600" }}>
                  Rotation Group:
                </Text>{" "}
                {user?.rotation_group || "N/A"}
              </Text>
              <Text style={[styles.profileContainerText, { color: textColor }]}>
                <Text style={{ color: accentColor, fontWeight: "600" }}>
                  Seminar Group:
                </Text>{" "}
                {user?.seminar_group || "N/A"}
              </Text>
              <Text style={[styles.profileContainerText, { color: textColor }]}>
                <Text style={{ color: accentColor, fontWeight: "600" }}>
                  CPW:
                </Text>{" "}
                {user?.cpw || "N/A"}
              </Text>
              <Text style={[styles.profileContainerText, { color: textColor }]}>
                <Text style={{ color: accentColor, fontWeight: "600" }}>
                  CPS:
                </Text>{" "}
                {user?.cps || "N/A"}
              </Text>
              <Text style={[styles.profileContainerText, { color: textColor }]}>
                <Text style={{ color: accentColor, fontWeight: "600" }}>
                  CPW/CPS:
                </Text>{" "}
                {user?.cpw_cps || "N/A"}
              </Text>
              <Text style={[styles.profileContainerText, { color: textColor }]}>
                <Text style={{ color: accentColor, fontWeight: "600" }}>
                  Simulated Home Visit Group:
                </Text>{" "}
                {user?.simulated_home_visit_group || "N/A"}
              </Text>
              <Text style={[styles.profileContainerText, { color: textColor }]}>
                <Text style={{ color: accentColor, fontWeight: "600" }}>
                  Car Owner:
                </Text>{" "}
                {user?.car_owner || "N/A"}
              </Text>
              <Text style={[styles.profileContainerText, { color: textColor }]}>
                <Text style={{ color: accentColor, fontWeight: "600" }}>
                  GP Teacher:
                </Text>{" "}
                {user?.gp_teacher_obj?.name || user?.gp_teacher || "N/A"}
              </Text>
              <Text style={[styles.profileContainerText, { color: textColor }]}>
                <Text style={{ color: accentColor, fontWeight: "600" }}>
                  Facilitator:
                </Text>{" "}
                {user?.facilitator?.name || "N/A"}
              </Text>
              <Text style={[styles.profileContainerText, { color: textColor }]}>
                {/* <Text style={{ color: accentColor, fontWeight: "600" }}>
                Placement:
              </Text>{" "}
              {user?.placement
                ? `${user.placement.barcode} - ${user.placement.bsms_id}`
                : "N/A"}*/}
              </Text>
              {/*     <Text style={[styles.profileContainerText, { color: textColor }]}>
              <Text style={{ color: accentColor, fontWeight: "600" }}>
                Group:
              </Text>{" "}
              {user?.group?.name || "N/A"}
            </Text> */}
              <Text style={[styles.profileContainerText, { color: textColor }]}>
                <Text style={{ color: accentColor, fontWeight: "600" }}>
                  Placement:
                </Text>{" "}
                {user?.location?.name || "N/A"}
              </Text>
              <Text style={[styles.profileContainerText, { color: textColor }]}>
                <Text style={{ color: accentColor, fontWeight: "600" }}>
                  Date Created:
                </Text>{" "}
                {user?.created_at
                  ? format(new Date(user.created_at), "dd-MM-yyyy")
                  : "N/A"}
              </Text>
            </View>

            {/* <View style={styles.locationContainer}>
            <EvilIcons name="location" size={24} color="gray" />
            <Text style={styles.textGray}>{user.created_at}</Text>
          </View> 

          <View style={styles.linkContainer}>
            <TouchableOpacity>
              <Text style={styles.textGray}>
             
            </Text>
            </TouchableOpacity>
            <View style={[styles.linkItem, styles.ml4]}>
              <EvilIcons name="calendar" size={24} color="gray" />
               <Text Style={{fontFamily:"Avenir", fontSize:13, color: 'black'}}>{user.created_at}
               
              </Text> 
            </View>
          </View>*/}

            <View
              style={[styles.separator, { borderBottomColor: borderColor }]}
            ></View>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor }]}>
      <View style={[styles.header, { backgroundColor: primaryColor }]}>
        <Image
          source={require("../assets/images/BSMS_logo_WO.png")}
          style={styles.headerLogo}
          resizeMode="contain"
        />
      </View>

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 8 }} size="large" color="gray" />
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <ProfileHeader />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  headerLogo: {
    height: 44,
    width: 280,
  },
  content: {
    paddingBottom: 24,
  },
  textGray: {
    color: "gray",
  },
  ml4: {
    marginLeft: 16,
  },
  container: {
    flex: 1,
  },
  backgroundImage: {
    width: "100%",
    height: 80,
  },
  avatarContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingHorizontal: 16,
    marginTop: -50,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    backgroundColor: "grey",
  },
  followButton: {
    backgroundColor: "#0f1418",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
  },
  followButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  nameContainer: {
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  profileName: {
    fontWeight: "bold",
    fontSize: 22,
  },
  profileHandle: {
    marginTop: 4,
    fontSize: 15,
  },
  profileContainer: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 6,
    borderWidth: 1,
  },
  profileContainerText: {
    lineHeight: 22,
    fontSize: 15,
  },
  locationContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    marginTop: 12,
  },
  linkContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    marginTop: 4,
  },
  linkColor: {
    color: "#1d9bf1",
  },
  linkItem: {
    flexDirection: "row",
  },
  followContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  followItem: {
    flexDirection: "row",
  },
  followItemNumber: {
    fontWeight: "bold",
  },
  followItemLabel: {
    marginLeft: 4,
  },
  separator: {
    borderBottomWidth: 1,
    marginTop: 12,
  },
});
