const axios = require('axios');

async function testCategoryAPI() {
    try {
        console.log('Testing category API...');
        
        // Test getting categories
        console.log('\n1. Testing GET /api/products/categories/list');
        const getResponse = await axios.get('http://localhost:5000/api/products/categories/list', {
            headers: {
                'Authorization': 'Bearer test-token'
            }
        });
        console.log('GET Response:', getResponse.data);
        
        // Test creating a category
        console.log('\n2. Testing POST /api/products/categories');
        const postResponse = await axios.post('http://localhost:5000/api/products/categories', {
            name: 'Test Category ' + Date.now(),
            description: 'Test category description'
        }, {
            headers: {
                'Authorization': 'Bearer test-token',
                'Content-Type': 'application/json'
            }
        });
        console.log('POST Response:', postResponse.data);
        
        // Test getting categories again
        console.log('\n3. Testing GET /api/products/categories/list again');
        const getResponse2 = await axios.get('http://localhost:5000/api/products/categories/list', {
            headers: {
                'Authorization': 'Bearer test-token'
            }
        });
        console.log('GET Response 2:', getResponse2.data);
        
    } catch (error) {
        console.error('API Test Error:', error.response?.data || error.message);
    }
}

testCategoryAPI();
