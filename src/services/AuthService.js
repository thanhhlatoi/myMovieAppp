const login = async (email, password) => {
    const response = await fetch('http://192.168.0.117:8082/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });
  
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Lỗi đăng nhập');
    }
  
    return await response.json();
  };
  
  export default { login };
  