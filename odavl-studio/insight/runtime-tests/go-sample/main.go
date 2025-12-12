package main

import (
	"fmt"
	"time"
)

// BAD: Global variable accessed by multiple goroutines without synchronization
var counter int

func increment() {
	// BAD: Race condition - unsynchronized access to shared variable
	for i := 0; i < 1000; i++ {
		counter++
	}
}

func main() {
	// BAD: Potential deadlock - starting goroutines that access shared state
	go increment()
	go increment()

	time.Sleep(100 * time.Millisecond)
	fmt.Printf("Counter: %d\n", counter)
}
