declare module "@amwebexpert/react-native-sign-here" {
  import * as React from "react";

  export type DrawHereRef = {
    clear?: () => void;
    exportSvg?: () => Promise<string>;
  };

  export type DrawingState = unknown;

  export type SignHereProps = {
    strokeColor?: string;
    strokeWidth?: number;
    onChange?: (state: DrawingState) => void;
  } & Record<string, any>;

  const SignHere: React.ForwardRefExoticComponent<
    React.PropsWithoutRef<SignHereProps> & React.RefAttributes<DrawHereRef>
  >;

  export default SignHere;
}
