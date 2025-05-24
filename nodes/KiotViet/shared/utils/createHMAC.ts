async function createHmacSignature(body: any, secret: string): Promise<string> {
	const encoder = new TextEncoder();

	// Chuyển secret thành định dạng Uint8Array để dùng với Web Crypto API
	const keyData = encoder.encode(secret);
	const bodyData = encoder.encode(typeof body === 'string' ? body : JSON.stringify(body));

	// Import key từ chuỗi secret
	const key = await crypto.subtle.importKey(
		'raw',
		keyData,
		{ name: 'HMAC', hash: 'SHA-256' },
		false,
		['sign'],
	);

	// Tạo chữ ký từ body
	const signatureBuffer = await crypto.subtle.sign('HMAC', key, bodyData);

	// Chuyển signature thành chuỗi hex
	const hashArray = Array.from(new Uint8Array(signatureBuffer));
	const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

	return hashHex;
}

export default createHmacSignature;
