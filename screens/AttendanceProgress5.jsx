import React, { useContext, useEffect, useMemo, useState } from "react";
//import { useSanctum } from "react-sanctum";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
//import moment from 'moment'
import { useThemeColor } from "@/components/Themed";
import { DataTable, Provider as PaperProvider } from "react-native-paper";
import Svg, { Path } from "react-native-svg";
import { AuthContext } from "../context/AuthProvider";
import axiosConfig from "../helpers/axiosConfig";
//import '@material-design-icons/font';
//import '@material-design-icons/font';
//import Ionicons from '@expo/vector-icons/Ionicons';
//import { id } from 'date-fns/locale';
//import axiosConfig from '../helpers/axiosConfig';
//import { AuthContext, AuthProvider } from '../context/AuthProvider';;
//import { MaterialIcons } from '@expo/vector-icons'

/*  let [useFont] = useFonts({
  'Material Design Icons': require('@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/MaterialCommunityIcons.ttf'),
});
 
let [customFont] = useFonts({
  'Material Design Icons': require('../assets/fonts/MaterialIconsRound-Regular.otf'),
});*/
/* const [isLoading, setIsLoading] = useState(false);
 setIsLoading(true);
          axiosConfig.defaults.headers.common[
            'Authorization'
          ] = `Bearer ${user.token}`; */

const WithSubtitle = () => {
  /* //set user response
 setUser(userResponse);
 setError(null);
 SecureStore.setItemAsync('user', JSON.stringify(userResponse));
 setIsLoading(false);
})
.catch(error => {
 console.log(error.response);
 const key = Object.keys(error.response.data.errors)[0];
 setError(error.response.data.errors[key][0]);
 setIsLoading(false);
});
}, */

  const [isLoading, setLoading] = useState(true);
  const { user } = useContext(AuthContext);

  const backgroundColor = useThemeColor({}, "background");
  const headingColor = useThemeColor({}, "heading");
  const accentColor = useThemeColor({}, "accent");
  const buttonTextColor = useThemeColor({}, "buttonText");
  const textColor = useThemeColor({}, "text");
  const cardColor = useThemeColor({}, "card");
  const borderColor = useThemeColor({}, "border");
  const [data, setData] = useState([]);
  const [font, setFont] = useState([]);

  const [updatedTallyForStudent, setupdatedTallyForStudent] = useState([]);
  const [loginTally, setTally] = useState([]);
  const [BSMSID, setBSMSID] = useState("bsms6636");
  const [signoffs, setSignoffs] = useState([]);
  const [locationsById, setLocationsById] = useState({});
  const [sessionAttendance, setSessionAttendance] = useState([]);
  const [dataMode, setDataMode] = useState("signoffs");
  const [Created_dates, setCreated_dates] = useState([0]);
  const [barcode, setBarcode] = useState([]);
  const [items, setItems] = useState([0]);
  const [loginTallyForStudent, setloginTallyForStudent] = useState(0);
  const [viewMode, setViewMode] = useState("cards");
  const percentage = useMemo(
    () => (loginTallyForStudent ? (100 * 13) / loginTallyForStudent : 0),
    [loginTallyForStudent],
  );

  const resolvedBSMSID = useMemo(() => {
    const candidate =
      user?.bsms_id ??
      user?.bsmsId ??
      user?.student_id ??
      user?.studentId ??
      user?.id;
    return candidate === undefined || candidate === null
      ? ""
      : String(candidate);
  }, [user]);

  useEffect(() => {
    if (resolvedBSMSID) {
      setBSMSID(resolvedBSMSID);
    }
  }, [resolvedBSMSID]);

  //const formattedDate = moment().format('YYYY-MM-DD');

  //console.log(formattedDate);

  /* useEffect(() => {
  // check if user is logged in or not.
  // Check SecureStore for the user object/token
  axiosConfig.defaults.headers.common[
    'Authorization'
  ] = `Bearer ${user.token}`;
  SecureStore.getItemAsync('user')
    .then(userString => {
      if (userString) {
        setUser(JSON.parse(userString));
      }
      setIsLoading(false);
    })
    .catch(err => {
      console.log(err);
      setIsLoading(false);
    });
    console.log('userData : ,StudentID');
}, []); */

  const headers = [
    {
      id: 1,
      title: "Practice",
    },
    {
      id: 2,
      title: "Barcode",
    },
    {
      id: 3,
      title: "Date",
    },
  ];

  useEffect(() => {
    if (BSMSID) {
      setLoading(true);
      Promise.all([
        axiosConfig.get("/location-signoffs"),
        axiosConfig.get("/locations2025"),
        axiosConfig.get(`/session-attendance?bsms_id=${BSMSID}`),
      ])
        .then(([signoffRes, locationsRes, sessionRes]) => {
          const allSignoffs = Array.isArray(signoffRes?.data)
            ? signoffRes.data
            : [];
          const mine = allSignoffs.filter(
            (item) => String(item?.bsms_id ?? "") === String(BSMSID),
          );

          const locationsArr = Array.isArray(locationsRes?.data)
            ? locationsRes.data
            : [];
          const byId = locationsArr.reduce((acc, loc) => {
            const id = String(loc?.id);
            if (!id) return acc;
            acc[id] = String(loc?.name ?? "");
            return acc;
          }, {});

          setLocationsById(byId);
          setSignoffs(mine);
          setItems(mine);
          setloginTallyForStudent(mine.length);

          const sessions = Array.isArray(sessionRes?.data)
            ? sessionRes.data
            : [];
          setSessionAttendance(sessions);
        })
        .catch((error) => console.error(error))
        .finally(() => setLoading(false));
    }
  }, [BSMSID]);

  const numberOfItemsPerPageList = [6, 7];
  const [page, setPage] = useState(0);
  const [numberOfItemsPerPage, onItemsPerPageChange] = useState(
    numberOfItemsPerPageList[0],
  );
  const from = page * numberOfItemsPerPage;
  const to = Math.min((page + 1) * numberOfItemsPerPage, signoffs.length);
  const pagedSignoffs = signoffs.slice(
    page * numberOfItemsPerPage,
    page * numberOfItemsPerPage + numberOfItemsPerPage,
  );

  const tableheader = (header) => (
    <DataTable.Title
      textStyle={{ fontFamily: "Avenir", fontSize: 14, color: accentColor }}
      key={header.id}
    >
      {header.title}
    </DataTable.Title>
  );

  const tableRow = (item, index) => {
    return (
      // <AuthContext.Provider>
      <DataTable.Row key={index}>
        <DataTable.Cell
          textStyle={{ fontFamily: "Avenir", fontSize: 14, color: textColor }}
        >
          {locationsById[String(item.location_id)] ??
            String(item.location_id ?? "")}
        </DataTable.Cell>
        <DataTable.Cell
          textStyle={{ fontFamily: "Avenir", fontSize: 13, color: textColor }}
        >
          {item.location_barcode}
        </DataTable.Cell>
        <DataTable.Cell
          textStyle={{ fontFamily: "Avenir", fontSize: 13, color: textColor }}
        >
          {item.created_at}
        </DataTable.Cell>
        {/*<DataTable.Cell>{format(date, "MMMM do, yyyy H:mma").item.created_at}</DataTable.Cell>
     <DataTable.Cell>{format ( new Date(item.created_at), 'dd mm yyyy T HH:mm:ss.000000')}.</DataTable.Cell>*/}
      </DataTable.Row>
      //    </AuthContext.Provider>
    );
  };

  const renderSignature = (d) => {
    const path = typeof d === "string" ? d.trim() : "";
    if (!path) return null;

    return (
      <View style={styles.signatureBox}>
        <Svg width="100%" height="100%">
          <Path
            d={path}
            stroke="#111827"
            strokeWidth={2.5}
            fill="none"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        </Svg>
      </View>
    );
  };

  const sessionCard = (item, index) => {
    const title = String(item.session_title ?? "Session #" + item.session_id);
    const subType = String(item.clinical_sub_type ?? "");
    const date = item.session_date
      ? new Date(item.session_date).toLocaleString("en-GB", {
          weekday: "short",
          day: "numeric",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "";

    return (
      <View key={index} style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{title}</Text>
          {!!date && <Text style={styles.cardSubtle}>{date}</Text>}
        </View>

        {!!subType && (
          <View style={styles.cardRow}>
            <Text style={styles.cardLabel}>Type</Text>
            <Text style={styles.cardValue}>{subType}</Text>
          </View>
        )}

        <View style={styles.cardRow}>
          <Text style={styles.cardLabel}>Student</Text>
          <Text style={styles.cardValue}>{String(item.bsms_id ?? "")}</Text>
        </View>
      </View>
    );
  };

  const recordCard = (item, index) => {
    const locationName =
      locationsById[String(item.location_id)] ?? String(item.location_id ?? "");
    const barcodeValue = String(item.location_barcode ?? "");
    const createdAt = String(item.created_at ?? "");
    const approverName = String(item.signOffName ?? item.sign_off_name ?? "");
    const approverReg = String(
      item.regNumberOfApprover ?? item.reg_number_of_approver ?? "",
    );
    const signature = item.signatureSvg ?? item.signature_svg ?? "";

    return (
      <View key={index} style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{locationName}</Text>
          {!!createdAt && <Text style={styles.cardSubtle}>{createdAt}</Text>}
        </View>

        <View style={styles.cardRow}>
          <Text style={styles.cardLabel}>Barcode</Text>
          <Text style={styles.cardValue}>{barcodeValue}</Text>
        </View>

        {!!approverName && (
          <View style={styles.cardRow}>
            <Text style={styles.cardLabel}>Approver</Text>
            <Text style={styles.cardValue}>{approverName}</Text>
          </View>
        )}

        {!!approverReg && (
          <View style={styles.cardRow}>
            <Text style={styles.cardLabel}>Approver</Text>
            <Text style={styles.cardValue}>{approverReg}</Text>
          </View>
        )}

        <View style={styles.cardSignatureSection}>
          <Text style={styles.cardLabel}>Signature</Text>
          {renderSignature(signature) || (
            <Text style={styles.cardSubtle}>No signature on record</Text>
          )}
        </View>
      </View>
    );
  };

  return (
    //  <AuthContext.Provider>
    <View style={[styles.container, { backgroundColor }]}>
      <Text style={{ fontSize: 15, color: textColor }}>
        Student ID : {items?.[0]?.bsms_id ?? BSMSID}
      </Text>

      <View style={styles.viewToggleRow}>
        <TouchableOpacity
          onPress={() => setDataMode("signoffs")}
          style={[
            styles.viewToggleButton,
            { borderColor: accentColor },
            dataMode === "signoffs" && { backgroundColor: accentColor },
          ]}
        >
          <Text
            style={[
              styles.viewToggleButtonText,
              { color: accentColor },
              dataMode === "signoffs" && { color: buttonTextColor },
            ]}
          >
            Sign-offs ({signoffs.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setDataMode("sessions")}
          style={[
            styles.viewToggleButton,
            { borderColor: accentColor },
            dataMode === "sessions" && { backgroundColor: accentColor },
          ]}
        >
          <Text
            style={[
              styles.viewToggleButtonText,
              { color: accentColor },
              dataMode === "sessions" && { color: buttonTextColor },
            ]}
          >
            Sessions ({sessionAttendance.length})
          </Text>
        </TouchableOpacity>
      </View>

      {dataMode === "signoffs" ? (
        <>
          <View style={styles.viewToggleRow}>
            <TouchableOpacity
              onPress={() => setViewMode("table")}
              style={[
                styles.viewToggleButton,
                { borderColor: accentColor },
                viewMode === "table" && { backgroundColor: accentColor },
              ]}
            >
              <Text
                style={[
                  styles.viewToggleButtonText,
                  { color: accentColor },
                  viewMode === "table" && { color: buttonTextColor },
                ]}
              >
                Table
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setViewMode("cards")}
              style={[
                styles.viewToggleButton,
                { borderColor: accentColor },
                viewMode === "cards" && { backgroundColor: accentColor },
              ]}
            >
              <Text
                style={[
                  styles.viewToggleButtonText,
                  { color: accentColor },
                  viewMode === "cards" && { color: buttonTextColor },
                ]}
              >
                Cards
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContainer}
          >
            <View style={styles.container2}>
              <PaperProvider>
                {viewMode === "table" ? (
                  <DataTable>
                    <DataTable.Header style={styles.textColor}>
                      {headers.map((header) => tableheader(header))}
                    </DataTable.Header>
                    <React.StrictMode>
                      {pagedSignoffs.map((row, index) => tableRow(row, index))}
                    </React.StrictMode>
                    <DataTable.Row style={styles.textColor}>
                      <DataTable.Cell>
                        Total Signoffs: {loginTallyForStudent}
                      </DataTable.Cell>
                    </DataTable.Row>
                    <DataTable.Pagination
                      page={page}
                      numberOfPages={Math.ceil(
                        signoffs.length / numberOfItemsPerPage,
                      )}
                      onPageChange={(page) => setPage(page)}
                      label={`${from + 1}-${to} of ${signoffs.length}`}
                      showFastPaginationControls
                      numberOfItemsPerPageList={numberOfItemsPerPageList}
                      numberOfItemsPerPage={numberOfItemsPerPage}
                      //onItemsPerPageChange={onItemsPerPageChange}
                      selectPageDropdownLabel={"Rows per page"}
                    />
                  </DataTable>
                ) : (
                  <View style={styles.cardsContainer}>
                    {pagedSignoffs.map((row, index) => recordCard(row, index))}
                    <View style={styles.paginationWrapper}>
                      <DataTable.Pagination
                        page={page}
                        numberOfPages={Math.ceil(
                          signoffs.length / numberOfItemsPerPage,
                        )}
                        onPageChange={(page) => setPage(page)}
                        label={`${from + 1}-${to} of ${signoffs.length}`}
                        showFastPaginationControls
                        numberOfItemsPerPageList={numberOfItemsPerPageList}
                        numberOfItemsPerPage={numberOfItemsPerPage}
                        //onItemsPerPageChange={onItemsPerPageChange}
                        selectPageDropdownLabel={"Rows per page"}
                      />
                    </View>
                  </View>
                )}
              </PaperProvider>
            </View>
          </ScrollView>
        </>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContainer}
        >
          <View style={styles.container2}>
            <View style={styles.cardsContainer}>
              {sessionAttendance.length === 0 ? (
                <Text
                  style={{
                    color: textColor,
                    fontFamily: "Avenir",
                    textAlign: "center",
                    marginTop: 20,
                  }}
                >
                  No session attendance records yet.
                </Text>
              ) : (
                sessionAttendance.map((row, index) => sessionCard(row, index))
              )}
            </View>
          </View>
        </ScrollView>
      )}
    </View>
    //  </AuthContext.Provider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    //marginTop: 20,
    //width: 120,
    //height: 170,
    width: "100%",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  container1: {
    flex: 1,
    //marginTop: 10,
    width: 150,
    height: 70,
    alignItems: "center",
    justifyContent: "center",
  },
  container2: {
    flex: 1,
    //marginTop: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  scrollView: {
    flex: 1,
    width: "100%",
  },
  scrollContainer: {
    minWidth: "100%",
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "flex-start",
  },
  item: {
    backgroundColor: "whitesmoke",
    width: "75%",
    marginHorizontal: "12.5%",
    marginVertical: "4%",
    justifyContent: "center",
    borderLeftWidth: 1,
  },
  itemText: {
    color: "white",
    left: 22,
  },
  textColor: {},

  viewToggleRow: {
    width: "92%",
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 12,
    marginBottom: 12,
    gap: 10,
  },
  viewToggleButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#FAD607",
    backgroundColor: "transparent",
  },
  viewToggleButtonActive: {},
  viewToggleButtonText: {
    fontFamily: "Avenir",
    fontSize: 14,
  },
  viewToggleButtonTextActive: {},

  cardsContainer: {
    width: "100%",
    paddingHorizontal: 14,
    paddingBottom: 10,
  },
  card: {
    width: "100%",
    border: "#659933",
    backgroundColor: "#659933",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#fad60759",
    padding: 14,
    marginBottom: 12,
  },
  cardHeader: {
    marginBottom: 10,
  },
  cardTitle: {
    fontFamily: "Avenir",
    fontSize: 16,
    marginBottom: 2,
  },
  cardSubtle: {
    fontFamily: "Avenir",
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.75)",
  },
  cardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
    gap: 12,
  },
  cardLabel: {
    fontFamily: "Avenir",
    fontSize: 13,
  },
  cardValue: {
    fontFamily: "Avenir",
    fontSize: 13,
    flexShrink: 1,
    textAlign: "right",
  },
  cardSignatureSection: {
    marginTop: 6,
  },
  signatureBox: {
    width: "100%",
    height: 120,
    marginTop: 8,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(17, 24, 39, 0.10)",
  },
  paginationWrapper: {
    marginTop: 6,
  },
});

export default WithSubtitle;
