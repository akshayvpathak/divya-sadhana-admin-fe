export interface GeneratePreviewUrlResponse {
  message: string;
  data: {
    object_key: string;
    url: string;
  };
}