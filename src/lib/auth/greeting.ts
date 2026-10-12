// Day-part greeting key from the device hour (06:00–17:59 → day).
// Shared by the auth greetings so welcome and login stay in sync.

export function dayPartKey(): 'welcome.day' | 'welcome.evening' {
	try {
		const h = new Date().getHours();
		return h >= 6 && h < 18 ? 'welcome.day' : 'welcome.evening';
	} catch {
		return 'welcome.day';
	}
}
