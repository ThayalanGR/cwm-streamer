import { Configuration, PopupRequest } from "@azure/msal-browser";

export const msalConfig: Configuration = {
    auth: {
        clientId: "YOUR_CLIENT_ID_HERE", // Replace with your Azure AD app's client ID
        authority: "https://login.microsoftonline.com/YOUR_TENANT_ID", // Replace with your Azure AD tenant ID
        redirectUri: "http://localhost:3000" // Replace with your app's redirect URI
    },
    cache: {
        cacheLocation: "sessionStorage",
        storeAuthStateInCookie: false,
    }
};

export const loginRequest: PopupRequest = {
    scopes: ["User.Read"]
};