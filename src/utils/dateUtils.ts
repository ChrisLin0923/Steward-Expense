export const toLocalDate = (date: Date | string) => {
	const d = new Date(date);
	return new Date(d.getTime() + d.getTimezoneOffset() * 60000);
};

export const startOfDay = (date: Date) => {
	const d = new Date(date);
	d.setHours(0, 0, 0, 0);
	return d;
};

export const endOfDay = (date: Date) => {
	const d = new Date(date);
	d.setHours(23, 59, 59, 999);
	return d;
};

export const formatDate = (
	date: Date,
	format: Intl.DateTimeFormatOptions = {
		month: "short",
		day: "numeric",
		year: "numeric",
	}
) => {
	return new Date(date).toLocaleDateString("en-US", {
		...format,
		timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
	});
};
