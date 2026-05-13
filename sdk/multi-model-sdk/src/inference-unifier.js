export class InferenceUnifier {
  normalize(response, model) {
    return {
      modelId: model.modelId,
      provider: model.provider,
      text: response.text ?? response.output ?? String(response),
      metadata: response.metadata ?? {},
    };
  }
}
