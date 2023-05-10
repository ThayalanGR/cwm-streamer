/// <reference types="vite/client" />

declare module "react-toggle-button" {
  function ToggleButton(props: {
    value: boolean;
    onToggle?: (value: boolean) => void;
    inactiveLabel?: React.ReactNode;
    activeLabel?: React.ReactNode;
    colors?: {
      activeThumb?: {
        base?: string;
      };
      active?: {
        base?: string;
      };
    };
    trackStyle?: React.CSSProperties;
  }): JSX.Element;

  export default ToggleButton;
}
