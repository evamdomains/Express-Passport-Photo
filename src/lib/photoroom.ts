import { sendErrorAlert } from './alert';

const PHOTOROOM_API = 'https://sdk.photoroom.com/v1/segment';

export async function removeBackground(imageBuffer: Buffer): Promise<Buffer> {
  const formData = new FormData();
  formData.append(
    'image_file',
    new Blob([new Uint8Array(imageBuffer)], { type: 'image/jpeg' }),
    'photo.jpg'
  );

  let response: Response;
  try {
    response = await fetch(PHOTOROOM_API, {
      method: 'POST',
      headers: { 'x-api-key': process.env.PHOTOROOM_API_KEY! },
      body: formData,
    });
  } catch (networkError) {
    await sendErrorAlert({
      api: 'PhotoRoom',
      error: networkError,
      context: { operation: 'removeBackground', cause: 'network error / fetch failed' },
    });
    throw networkError;
  }

  if (!response.ok) {
    const body = await response.text().catch(() => '(unreadable body)');
    const error = new Error(`PhotoRoom API error ${response.status}: ${body}`);
    await sendErrorAlert({
      api: 'PhotoRoom',
      error,
      context: { statusCode: response.status, responseBody: body },
    });
    throw error;
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
