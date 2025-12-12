mod helper;

fn main() {
    let _unused_var = 42; // BAD: Unused variable
    
    // BAD: Unwrap without error handling
    let data = vec![1, 2, 3];
    let value = data.get(10).unwrap(); // Will panic!
    
    println!("Value: {}", value);
    
    // BAD: Explicit panic call
    if true {
        panic!("Intentional panic for testing!");
    }
    
    helper::process_data(data);
}
