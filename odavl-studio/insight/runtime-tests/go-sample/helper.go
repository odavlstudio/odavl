package main

import "fmt"

// BAD: Unused variable
var unusedGlobal = "never used"

func ProcessData(data []int) {
	// BAD: Potential panic - no bounds checking
	result := data[10] // Will panic if slice length < 11
	fmt.Println(result)

	// BAD: Goroutine leak - no way to stop this
	go func() {
		for {
			// Infinite loop without exit condition
		}
	}()
}
