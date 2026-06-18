import React, {useState} from 'react';
import { Text, View, TextInput} from 'react-native';

const LoginForm = () => {
  //const [value, setValue] = useState({email});
  return (
    <View>
      <Text> Login Form </Text>
      <View>
        <TextInput placeholder="Enter Email" />
        <TextInput
          secureTextEntry={true}
          placeholder="Enter Password"
        />
      </View>
    </View>
  );
};

export default LoginForm;
