import React, { useContext, useEffect, useRef, useState, setState } from 'react';
import { Alert, Text, TextInput, View, StyleSheet, Button, Dimensions, TouchableOpacity, FlatList } from 'react-native';
import axiosConfig from '../../helpers/axiosConfig';
import axios from 'axios';


  
export const ResetPassword = ({ navigation, route }) => {
  const { email, code } = route.params;
  // in your view you provide a form to set the new password

  const [newPassword, setNewPassword] = useState('');

  const onButtonPress = () => {
    // call api with params email, code, newPassword
    axios.post('https://placements.bsms.ac.uk/api/reset',{ email:email, code:code, newPassword:newPassword })
  .then(data => console.log(data))
    .catch(data => console.log(data))
    
  };

  return (

   // here you provide a form and a button for your api call
   <View>
<View style={styles.TextBox}>
      <TextInput
        style={{ backgroundColor: 'white', width: '100%', height: 44 }}
        placeholder='email address' 
        placeholderTextColor="#FAD607"
        value={barcode}
        editable={false}
      />
    </View>

    
    <View>
    <TouchableOpacity onPress = {onButtonPress} title="save">
    <Text style={styles.subTitleText2}>{onButtonPress}</Text> 
      </TouchableOpacity> 
     </View>
     </View>

  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    //justifyContent: 'center',
    backgroundColor: '#005E7E',
    padding: 8,
  },
  TextBox: {
    //height: 160,
    //width: 300,
    //marginLeft: -2,
  },
  SaveButton:{
   height: 25,
    width: 60,
    marginTop: 20,
    borderColor:'#FAD607',
  },
  
  titleText: {
    fontWeight: 'bold',
    fontFamily: 'Verdana',
    //fontFamily: 'Roboto-Regular',
    color:'#FAD607',
    fontSize: 18,
    width: 250, 
    height: 44, 
    //justifyContent: 'center',
    //alignItems: 'center',
    //paddingLeft: 10,
    //: 5,
    //marginTop: 30
    
  },
  subTitleText: {
    //fontWeight: 'bold',
    fontFamily: 'Verdana',
    //fontFamily: 'Roboto-Regular',
    marginTop: 10,
    color:'#FAD607',
    fontSize: 15,
    width: 280, 
    height: 44, 
  },
  subTitleText2: {
    //flexDirection: 'column',
    //fontWeight: 'bold',
    fontFamily: 'Verdana',
    //fontFamily: 'Roboto-Regular',
    marginTop: 15,
    marginLeft: 0,
    padding: 5,
    color:'#FAD607',
    fontSize: 18,
    width: 70, 
    height: 44, 
    borderColor: '#FAD607',
    borderStyle:'solid',
    borderRadius: 8,
    borderWidth: 3,
  },
  subTitleText3: {
    flexDirection: 'row',
    fontWeight: 'bold',
    fontFamily: 'Verdana',
    //fontFamily: 'Roboto-Regular',
    marginLeft: 10,
    padding: 5,
    color:'#FAD607',
    fontSize: 18,
    width: 14, 
    height: 30, 
    borderColor: '#FAD607',
    borderStyle:'dotted',
    borderRadius: 4,
    borderWidth: 1,
    //justifyContent: 'center',
    alignItems:'flex-start'
  },
  item: {
    backgroundColor: '#FAD607',
    borderRadius: 20,
    padding: 15,
    marginVertical: 5,
    marginHorizontal: 8,
    marginBottom: 15,
  }, 
  /* BoxBorder: {
    marginTop: 25,
    //width: (width /2)-10, 
    //height: '20%',
    borderColor: '#FAD607',
    borderStyle:'solid',
    borderRadius: 8,
    borderWidth: 3,
    marginHorizontal: 5,
    //justifyContent: 'center',
    alignItems: 'flex-start',
  },
 */

  Button:{
    color:'#FAD607',
  
  },
  listcontainer: {
    flexDirection: 'row',
    backgroundColor: '#FAD607',
    //borderColor: '#FAD607',
    //paddingTop: 5,
//borderRadius: 20,
    //padding: 5,
    marginVertical: 5,
    marginHorizontal: 8,
    marginBottom: 15,
    alignItems: 'center', 
    fontWeight: 'bold',
    //fontFamily: 'Roboto_Regular',
    fontFamily: 'Verdana',
    fontSize: 18, 
   },
})

export default ResetPassword;