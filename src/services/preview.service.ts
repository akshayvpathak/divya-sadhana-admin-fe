import { GeneratePreviewUrlResponse } from "@/types/preview.types";
import { api } from "./api.service";

class PreviewService {
  private api: typeof api;
  controller: string = "generate-preview-url";

  constructor() {
    this.api = api;
  }

  async generatePreviewUrl(
    objectKey: string,
  ): Promise<GeneratePreviewUrlResponse> {
    return this.api.post<GeneratePreviewUrlResponse>(
      `/${this.controller}`,
      { object_key: objectKey },
    );
  }
}

export const previewService = new PreviewService();
