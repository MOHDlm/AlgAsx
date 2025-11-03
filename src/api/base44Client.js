export const base44 = {
  entities: {
    Property: {},
    Investment: {},
  },
  integrations: {
    Core: {
      InvokeLLM: () => console.log("InvokeLLM disabled (mock)"),
      SendEmail: () => console.log("SendEmail disabled (mock)"),
      UploadFile: () => console.log("UploadFile disabled (mock)"),
      GenerateImage: () => console.log("GenerateImage disabled (mock)"),
      ExtractDataFromUploadedFile: () => console.log("ExtractDataFromUploadedFile disabled (mock)"),
      CreateFileSignedUrl: () => console.log("CreateFileSignedUrl disabled (mock)"),
      UploadPrivateFile: () => console.log("UploadPrivateFile disabled (mock)"),
    },
  },
  auth: {
    login: () => console.log("Mock login called"),
    logout: () => console.log("Mock logout called"),
    currentUser: { name: "Local User", email: "user@localhost" },
  },
};
