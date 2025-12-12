
const model = await tf.loadLayersModel('models/model.json');
const input = tf.tensor([1, 128, 128, 3]); // Wrong!
const prediction = model.predict(input);
