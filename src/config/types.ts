export interface ReportData<T> {
	task: string
	apikey: string
	answer: T
}
export interface ReportResponse {
	code: number
	message: string
}
