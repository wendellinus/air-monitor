package main

import (
	"compress/gzip"
	"fmt"
	"io"
	"net/http"
	"time"
)

func main() {
	key := "b3eb639411134839b01425495ed43eec" // 从配置文件读取的 Key
	
	// 1. 测试 GeoAPI (尝试多个变种)
	geoURLs := []string{
		fmt.Sprintf("https://geoapi.qweather.com/v2/city/lookup?location=Beijing&key=%s", key),
		fmt.Sprintf("https://geoapi.qweather.com/geo/v2/city/lookup?location=Beijing&key=%s", key), // 尝试加 /geo 前缀
		fmt.Sprintf("https://devapi.qweather.com/v2/city/lookup?location=Beijing&key=%s", key),     // 尝试 devapi
		fmt.Sprintf("https://devapi.qweather.com/geo/v2/city/lookup?location=Beijing&key=%s", key), // 尝试 devapi + /geo
	}

	for i, url := range geoURLs {
		fmt.Printf("Testing GeoAPI [%d]: %s\n", i+1, url)
		testURL(url)
		fmt.Println("--------------------------------")
	}

	// 2. 测试 AirAPI
	airURL := fmt.Sprintf("https://devapi.qweather.com/v7/air/now?location=101010100&key=%s", key)
	fmt.Println("Testing AirAPI:", airURL)
	testURL(airURL)
}

func testURL(url string) {
	client := &http.Client{Timeout: 5 * time.Second}
	req, _ := http.NewRequest("GET", url, nil)
	// 模拟浏览器 User-Agent，防止被拦截
	req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36")
	req.Header.Set("Accept-Encoding", "gzip, deflate, br")

	resp, err := client.Do(req)
	if err != nil {
		fmt.Printf("Request failed: %v\n", err)
		return
	}
	defer resp.Body.Close()

	fmt.Printf("Status Code: %d\n", resp.StatusCode)

	var reader io.ReadCloser
	switch resp.Header.Get("Content-Encoding") {
	case "gzip":
		reader, _ = gzip.NewReader(resp.Body)
		defer reader.Close()
	default:
		reader = resp.Body
	}

	body, _ := io.ReadAll(reader)
	fmt.Printf("Response Body: %s\n", string(body))
}
