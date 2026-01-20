package main

import (
	"crypto/ed25519"
	"crypto/rand"
	"crypto/x509"
	"encoding/pem"
	"fmt"
	"os"
)

func main() {
	// 1. 生成 Ed25519 密钥对
	pub, priv, err := ed25519.GenerateKey(rand.Reader)
	if err != nil {
		fmt.Printf("Failed to generate key: %v\n", err)
		os.Exit(1)
	}

	// 2. 序列化私钥 (PKCS#8)
	privBytes, err := x509.MarshalPKCS8PrivateKey(priv)
	if err != nil {
		fmt.Printf("Failed to marshal private key: %v\n", err)
		os.Exit(1)
	}
	privPem := pem.EncodeToMemory(&pem.Block{
		Type:  "PRIVATE KEY",
		Bytes: privBytes,
	})

	// 3. 序列化公钥 (PKIX)
	pubBytes, err := x509.MarshalPKIXPublicKey(pub)
	if err != nil {
		fmt.Printf("Failed to marshal public key: %v\n", err)
		os.Exit(1)
	}
	pubPem := pem.EncodeToMemory(&pem.Block{
		Type:  "PUBLIC KEY",
		Bytes: pubBytes,
	})

	// 4. 输出结果
	fmt.Println("=== Ed25519 Key Pair Generated Successfully ===")
	fmt.Println("\n[Private Key] (Copy this to configs/config.yaml -> private_key)")
	fmt.Println(string(privPem))

	fmt.Println("\n[Public Key] (Copy this to QWeather Console -> Create Credential -> JWT)")
	fmt.Println(string(pubPem))
}
