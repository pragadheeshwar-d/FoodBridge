-- FoodBridge local MySQL schema reference.
-- The Flask app creates and upgrades these tables through SQLAlchemy on startup.

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(120) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL,
  organization VARCHAR(150),
  phone VARCHAR(20),
  address VARCHAR(255),
  profile_image TEXT,
  business_type VARCHAR(50),
  verification_id VARCHAR(100),
  operating_hours VARCHAR(100),
  verified BOOLEAN DEFAULT FALSE,
  verification_token VARCHAR(100),
  verification_expiry DATETIME,
  status VARCHAR(20) DEFAULT 'pending',
  reset_token VARCHAR(100),
  reset_expiry DATETIME,
  settings_json TEXT,
  created_at DATETIME
);

CREATE TABLE donations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  donor_id INT NOT NULL,
  food_name VARCHAR(150) NOT NULL,
  food_type VARCHAR(50) NOT NULL,
  category VARCHAR(50),
  veg_type VARCHAR(20),
  quantity VARCHAR(50) NOT NULL,
  quantity_number FLOAT,
  remaining_quantity FLOAT,
  unit VARCHAR(20),
  description TEXT,
  special_instructions TEXT,
  image TEXT,
  pickup_address VARCHAR(255) NOT NULL,
  latitude FLOAT,
  longitude FLOAT,
  pickup_time DATETIME,
  expiry_time DATETIME NOT NULL,
  preparation_time VARCHAR(50),
  preferred_pickup_time VARCHAR(50),
  storage_method VARCHAR(50),
  current_temperature FLOAT,
  predicted_expiry DATETIME,
  freshness_score INT,
  risk_level VARCHAR(20),
  ai_recommendation TEXT,
  status VARCHAR(20) DEFAULT 'Available',
  created_at DATETIME,
  FOREIGN KEY (donor_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE pickup_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  donation_id INT NOT NULL,
  receiver_id INT NOT NULL,
  status VARCHAR(20) DEFAULT 'Pending',
  request_message TEXT,
  requested_quantity FLOAT,
  allocated_quantity FLOAT NOT NULL DEFAULT 0,
  allocation_status VARCHAR(30),
  qr_token VARCHAR(100) UNIQUE,
  qr_used BOOLEAN DEFAULT FALSE,
  requested_at DATETIME,
  approved_at DATETIME,
  completed_at DATETIME,
  FOREIGN KEY (donation_id) REFERENCES donations(id) ON DELETE CASCADE,
  FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE allocations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  pickup_request_id INT NOT NULL,
  donation_id INT NOT NULL,
  receiver_id INT NOT NULL,
  quantity FLOAT NOT NULL,
  created_at DATETIME,
  FOREIGN KEY (pickup_request_id) REFERENCES pickup_requests(id) ON DELETE CASCADE,
  FOREIGN KEY (donation_id) REFERENCES donations(id) ON DELETE CASCADE,
  FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE pickup_qr (
  id INT AUTO_INCREMENT PRIMARY KEY,
  pickup_request_id INT NOT NULL UNIQUE,
  qr_token VARCHAR(100) NOT NULL UNIQUE,
  generated_at DATETIME NOT NULL,
  expires_at DATETIME NOT NULL,
  scanned_at DATETIME,
  status VARCHAR(20) DEFAULT 'Active',
  FOREIGN KEY (pickup_request_id) REFERENCES pickup_requests(id) ON DELETE CASCADE
);

CREATE TABLE notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(150) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  link VARCHAR(255),
  created_at DATETIME,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sender_id INT NOT NULL,
  receiver_id INT NOT NULL,
  message TEXT NOT NULL,
  created_at DATETIME,
  is_read BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE certificates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  donation_id INT NOT NULL,
  donor_id INT NOT NULL,
  receiver_id INT NOT NULL,
  certificate_url VARCHAR(255),
  generated_at DATETIME,
  FOREIGN KEY (donation_id) REFERENCES donations(id) ON DELETE CASCADE,
  FOREIGN KEY (donor_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
);
