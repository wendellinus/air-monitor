package config

// Server 类似于 TS 中的 root interface，汇总所有配置
type Server struct {
	System   System         `mapstructure:"system" json:"system" yaml:"system"`
	Log      Log            `mapstructure:"log" json:"log" yaml:"log"`
	Pgsql    Pgsql          `mapstructure:"pgsql" json:"pgsql" yaml:"pgsql"`
	JWT      JWT            `mapstructure:"jwt" json:"jwt" yaml:"jwt"`
	Redis    Redis          `mapstructure:"redis" json:"redis" yaml:"redis"`
	QWeather QWeatherConfig `mapstructure:"qweather" json:"qweather" yaml:"qweather"`
	Cron     CronConfig     `mapstructure:"cron" json:"cron" yaml:"cron"`
	Cache    CacheConfig    `mapstructure:"cache" json:"cache" yaml:"cache"`
}

// System 系统配置
type System struct {
	Env  string `mapstructure:"env" json:"env" yaml:"env"`    // 环境值: public, dev
	Host string `mapstructure:"host" json:"host" yaml:"host"` // 主机地址，如 localhost 或 0.0.0.0
	Port int    `mapstructure:"port" json:"port" yaml:"port"` // 端口
}

type Log struct {
	Level      string `mapstructure:"level" json:"level" yaml:"level"`                   // 级别: debug, info, error
	RootDir    string `mapstructure:"root_dir" json:"root_dir" yaml:"root_dir"`          // 日志输出目录
	Filename   string `mapstructure:"filename" json:"filename" yaml:"filename"`          // 文件名
	ShowLine   bool   `mapstructure:"show_line" json:"show_line" yaml:"show_line"`       // 是否显示行号
	MaxAge     int    `mapstructure:"max_age" json:"max_age" yaml:"max_age"`             // 保留天数
	MaxSize    int    `mapstructure:"max_size" json:"max_size" yaml:"max_size"`          // 单个文件最大尺寸(MB)
	MaxBackups int    `mapstructure:"max_backups" json:"max_backups" yaml:"max_backups"` // 备份数量
}

type Pgsql struct {
	Path         string `mapstructure:"path" json:"path" yaml:"path"`                               // 服务器地址: 127.0.0.1
	Port         string `mapstructure:"port" json:"port" yaml:"port"`                               // 端口
	Config       string `mapstructure:"config" json:"config" yaml:"config"`                         // 高级配置，如 sslmode=disable
	Dbname       string `mapstructure:"db-name" json:"db-name" yaml:"db-name"`                      // 数据库名
	Username     string `mapstructure:"username" json:"username" yaml:"username"`                   // 用户名
	Password     string `mapstructure:"password" json:"password" yaml:"password"`                   // 密码
	MaxIdleConns int    `mapstructure:"max-idle-conns" json:"max-idle-conns" yaml:"max-idle-conns"` // 空闲连接数
	MaxOpenConns int    `mapstructure:"max-open-conns" json:"max-open-conns" yaml:"max-open-conns"` // 打开到数据库的最大连接数
	LogMode      string `mapstructure:"log-mode" json:"log-mode" yaml:"log-mode"`                   // Gorm日志级别: silent, error, warn, info
}

type JWT struct {
	SigningKey  string `mapstructure:"signing-key" json:"signing-key" yaml:"signing-key"`    // 签名密钥
	ExpiresTime string `mapstructure:"expires-time" json:"expires-time" yaml:"expires-time"` // 过期时间 (比如 "24h")
	Issuer      string `mapstructure:"issuer" json:"issuer" yaml:"issuer"`                   // 签发者
}

type Redis struct {
	Addr     string `mapstructure:"addr" json:"addr" yaml:"addr"`             // Redis 地址 127.0.0.1:6379
	Password string `mapstructure:"password" json:"password" yaml:"password"` // 密码
	DB       int    `mapstructure:"db" json:"db" yaml:"db"`                   // 数据库序号，默认 0
}

type QWeatherConfig struct {
	Enable     bool   `mapstructure:"enable" yaml:"enable"`
	Key        string `mapstructure:"key" json:"key" yaml:"key"`                         // API Key (Optional if using JWT)
	PublicID   string `mapstructure:"public_id" json:"public_id" yaml:"public_id"`       // JWT Public ID (Key ID)
	ProjectID  string `mapstructure:"project_id" json:"project_id" yaml:"project_id"`    // Project ID
	PrivateKey string `mapstructure:"private_key" json:"private_key" yaml:"private_key"` // JWT Private Key (PEM content)
	Host       string `mapstructure:"host" json:"host" yaml:"host"`                      // API Host
	Timeout    int    `mapstructure:"timeout" yaml:"timeout"`                            // Timeout in seconds
	Debug      bool   `mapstructure:"debug" yaml:"debug"`                                // Debug mode
}

// CronConfig 定时任务配置
type CronConfig struct {
	Enabled      bool              `mapstructure:"enabled" yaml:"enabled"`
	AlertSync    AlertSyncConfig   `mapstructure:"alert_sync" yaml:"alert_sync"`
	CacheRefresh CacheRefreshConfig `mapstructure:"cache_refresh" yaml:"cache_refresh"`
}

// AlertSyncConfig 预警同步任务配置
type AlertSyncConfig struct {
	Schedule  string           `mapstructure:"schedule" yaml:"schedule"`   // Cron 表达式，如 "@every 30m" 或 "0 */30 * * * *"
	Locations []LocationConfig `mapstructure:"locations" yaml:"locations"` // 监控的城市列表
}

// CacheRefreshConfig 缓存刷新任务配置
type CacheRefreshConfig struct {
	Enabled  bool           `mapstructure:"enabled" yaml:"enabled"`   // 是否启用
	Schedule string         `mapstructure:"schedule" yaml:"schedule"` // Cron 表达式，如 "0 */50 * * * *"
	Regions  []RegionConfig `mapstructure:"regions" yaml:"regions"`   // 要刷新的地区列表
}

// RegionConfig 热门城市地区配置
type RegionConfig struct {
	Name  string `mapstructure:"name" yaml:"name"`   // 地区代码，如 "cn", "world"
	Count int    `mapstructure:"count" yaml:"count"` // 获取数量
}

// LocationConfig 监控城市配置
type LocationConfig struct {
	Name string `mapstructure:"name" yaml:"name"` // 城市名称（用于日志）
	Lat  string `mapstructure:"lat" yaml:"lat"`   // 纬度
	Lon  string `mapstructure:"lon" yaml:"lon"`   // 经度
}

// CacheConfig 缓存 TTL 配置
// TTL 使用字符串格式，如 "45m", "10h", "1h30m"
type CacheConfig struct {
	// 空气质量相关
	AirRealtimeTTL string `mapstructure:"air_realtime_ttl" yaml:"air_realtime_ttl"` // 实时空气质量 (推荐 30-60 分钟)
	AirHourlyTTL   string `mapstructure:"air_hourly_ttl" yaml:"air_hourly_ttl"`     // 逐小时预报 (推荐 30-60 分钟)
	AirDailyTTL    string `mapstructure:"air_daily_ttl" yaml:"air_daily_ttl"`       // 逐天预报 (推荐 8-12 小时)

	// 天气预警
	WeatherAlertTTL string `mapstructure:"weather_alert_ttl" yaml:"weather_alert_ttl"` // 天气预警 (推荐 5-20 分钟)

	// 城市数据
	TopCitiesTTL string `mapstructure:"top_cities_ttl" yaml:"top_cities_ttl"` // 热门城市
}
