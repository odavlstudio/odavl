pub fn process_data(data: Vec<i32>) {
    let _unused_result = 100; // BAD: Unused variable
    
    // BAD: Potential integer overflow without checked arithmetic
    for i in 0..data.len() {
        let result = data[i] * 1000000; // Could overflow
        println!("Result: {}", result);
    }
    
    // BAD: Unreachable code after panic
    panic!("Another intentional panic!");
    println!("This will never execute");
}
