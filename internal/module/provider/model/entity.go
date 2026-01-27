package model

type Summary struct {
	AsOf           string         `json:"asOf"`                   // 当前数据的截止日期
	Currency       string         `json:"currency"`               // 货币代码：CNY, USD
	Balance        float64        `json:"balance"`                // 可用额度
	AccruedCharges AccruedCharges `json:"accruedCharges"`         // 应计费用
	PendingBills   []PendingBill  `json:"pendingBills"`           // 待支付账单
	SavingsPlans   []SavingsPlan  `json:"availableSavingsPlans"`  // 节省计划
	ResourcePlans  []ResourcePlan `json:"availableResourcePlans"` // 资源包
}

type AccruedCharges struct {
	PreviousDay   float64 `json:"previousDay"`   // 前一天应计费用总额
	ThisMonth     float64 `json:"thisMonth"`     // 本月应计费用总额
	SinceLastBill float64 `json:"sinceLastBill"` // 从上次出账以来的应计费用总额
}

type PendingBill struct {
	Number    string  `json:"number"`    // 待支付账单号
	Type      string  `json:"type"`      // 待支付账单的类型
	Amount    float64 `json:"amount"`    // 账单的总金额
	AmountDue float64 `json:"amountDue"` // 账单剩余应付金额
	DueDate   string  `json:"dueDate"`   // 应付日期
}

type SavingsPlan struct {
	BillNumber    string  `json:"billNumber"`    // 账单号
	Status        string  `json:"status"`        // 状态：pending, active
	Term          string  `json:"term"`          // 承诺期限
	Commitments   float64 `json:"commitments"`   // 承诺金额
	Utilized      float64 `json:"utilized"`      // 已用承诺金额
	EffectiveTime string  `json:"effectiveTime"` // 生效时间
}

type ResourcePlan struct {
	BillNumber    string `json:"billNumber"`    // 账单号
	Status        string `json:"status"`        // 状态：pending, active
	Requests      int64  `json:"requests"`      // 总请求量
	Utilized      int64  `json:"utilized"`      // 已用请求量
	EffectiveTime string `json:"effectiveTime"` // 生效时间
}

type Stats struct {
	AsOf    string     `json:"asOf"`    // 当前数据的截止日期
	Success []APIStats `json:"success"` // 成功请求统计
	Errors  []APIStats `json:"errors"`  // 错误请求统计
}

type APIStats struct {
	API   string  `json:"api"`   // API名称
	Hours []int64 `json:"hours"` // 最近24小时每小时的请求量
}
