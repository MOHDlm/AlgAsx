
export const Core = {
  InvokeLLM: (prompt) => {
    console.log("InvokeLLM (mock):", prompt);
    return { reply: "هذا رد تجريبي من الذكاء الاصطناعي المحلي (mock)." };
  },

  SendEmail: (to, subject, body) => {
    console.log("SendEmail (mock):", { to, subject, body });
    return { success: true, message: "Email sent locally (mock)" };
  },

  UploadFile: (file) => {
    console.log("UploadFile (mock):", file?.name || "no file");
    return { url: "/uploads/mock-file.txt" };
  },

  GenerateImage: (prompt) => {
    console.log("GenerateImage (mock):", prompt);
    return { url: "https://via.placeholder.com/512x512?text=Mock+Image" };
  },

  ExtractDataFromUploadedFile: (file) => {
    console.log("ExtractDataFromUploadedFile (mock):", file?.name || "no file");
    return { extractedText: "This is mock extracted data from file." };
  },

  CreateFileSignedUrl: (fileName) => {
    console.log("CreateFileSignedUrl (mock):", fileName);
    return { url: `/uploads/${fileName}` };
  },

  UploadPrivateFile: (file) => {
    console.log("UploadPrivateFile (mock):", file?.name || "no file");
    return { success: true, message: "Private file uploaded locally (mock)" };
  },
};

// لتوافق مع الكود الأصلي في حال كان يستورد الدوال مباشرة
export const InvokeLLM = Core.InvokeLLM;
export const SendEmail = Core.SendEmail;
export const UploadFile = Core.UploadFile;
export const GenerateImage = Core.GenerateImage;
export const ExtractDataFromUploadedFile = Core.ExtractDataFromUploadedFile;
export const CreateFileSignedUrl = Core.CreateFileSignedUrl;
export const UploadPrivateFile = Core.UploadPrivateFile;
