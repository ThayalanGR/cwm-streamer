import { Configuration, PopupRequest } from "@azure/msal-browser";

export const msalConfig: Configuration = {
    auth: {
        clientId: "d10723ca-4573-46a3-b1c5-36afa36d18e3", // Replace with your Azure AD app's client ID
        authority: "https://login.microsoftonline.com/9f84ee4b-bee3-42f7-b84c-e57e5e92f105", // Replace with your Azure AD tenant ID
        redirectUri: "http://localhost:5173/login" // Replace with your app's redirect URI
    },
    cache: {
        cacheLocation: "sessionStorage",
        storeAuthStateInCookie: false,
    }
};

export const loginRequest: PopupRequest = {
    scopes: ["User.Read"]
};