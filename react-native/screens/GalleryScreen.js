import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator,
  TextInput, ScrollView, Image, Modal, FlatList, Dimensions
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { API_URL } from '../utils/constants';
import * as FileSystem from 'expo-file-system';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Print from 'expo-print';
import { shareAsync } from 'expo-sharing';

export default function GalleryScreen() {
  // State variables
  const [selectedImages, setSelectedImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [batchTitle, setBatchTitle] = useState('');
  const [error, setError] = useState('');
  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);

  // Search and filtering state
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredBatches, setFilteredBatches] = useState([]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isDateSelected, setIsDateSelected] = useState(false);

  // Image preview state
  const [previewImage, setPreviewImage] = useState(null);
  const [fullImageVisible, setFullImageVisible] = useState(false);
  const [previewBeforeUpload, setPreviewBeforeUpload] = useState(false);

  // Handle search and filtering
  const handleSearch = (text) => {
    setSearchQuery(text);
    filterBatches(text, isDateSelected ? selectedDate : null);
  };

  // Handle date change for filtering
  const handleDateChange = (event, date) => {
    setShowDatePicker(false);
    if (date) {
      setSelectedDate(date);
      setIsDateSelected(true);
      filterBatches(searchQuery, date);
    }
  };

  // Clear date filter
  const clearDateFilter = () => {
    setIsDateSelected(false);
    filterBatches(searchQuery, null);
  };

  // Filter batches by search query and date
  const filterBatches = (query, date) => {
    if (!batches || batches.length === 0) {
      setFilteredBatches([]);
      return;
    }

    let filtered = [...batches];

    // Filter by search query (title or referral_id)
    if (query) {
      const lowercasedQuery = query.toLowerCase();
      filtered = filtered.filter(batch =>
        (batch.title && batch.title.toLowerCase().includes(lowercasedQuery)) ||
        (batch.referral_id && batch.referral_id.toLowerCase().includes(lowercasedQuery))
      );
    }

    // Filter by date if selected
    if (date) {
      const selectedDateStr = date.toISOString().split('T')[0]; // Get YYYY-MM-DD
      filtered = filtered.filter(batch => {
        // Ensure batch has a created_at field
        if (batch && batch.created_at) {
          const batchDate = batch.created_at.split('T')[0];
          return batchDate === selectedDateStr;
        }
        return false;
      });
    }

    setFilteredBatches(filtered);
  };

  // Upload a new batch
  const uploadBatch = async () => {
    if (!batchTitle.trim()) {
      setError('Please enter a batch title');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const response = await fetch(`${API_URL}/batches/`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: batchTitle
        })
      });

      const result = await response.json();

      if (response.ok) {
        alert('Batch created successfully!');
        setBatchTitle('');
        fetchBatches(); // Refresh the list after upload
      } else {
        throw new Error(result.detail || 'Failed to create batch');
      }
    } catch (error) {
      console.error('Error creating batch:', error);
      setError('Failed to create batch: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  // Fetch all batches from the API
  const fetchBatches = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const response = await fetch(`${API_URL}/batches/`, {
        headers: { Authorization: `Token ${token}` },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Fetched batches:', data);

      setBatches(data || []);
      // Also update filtered batches with current filters
      filterBatches(searchQuery, isDateSelected ? selectedDate : null);
    } catch (error) {
      console.error('Error fetching batches:', error);
      setError('Failed to fetch batches: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Refresh function
  const handleRefresh = () => {
    setLoading(true);
    setError('');
    fetchBatches();
  };

  // View a specific batch
  const handleViewBatch = (batch) => {
    console.log('Selected batch:', batch);
    console.log('Batch images:', batch.images || []);
    setSelectedBatch(batch);
    setModalVisible(true);
  };

  // Preview an image in full screen
  const handleImagePreview = (image) => {
    setPreviewImage(image);
    setFullImageVisible(true);
  };

  // Add more images from gallery
  const handleAddMoreImages = async () => {
    try {
      const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
      const { status: libraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (cameraStatus !== 'granted' || libraryStatus !== 'granted') {
        alert('Permission to access camera and media library is required!');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedImages(result.assets);
        setPreviewBeforeUpload(true); // Show preview before upload
      }
    } catch (error) {
      console.error('Error picking images:', error);
      alert('Failed to select images: ' + error.message);
    }
  };

  // Take a photo with camera
  const handleTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        alert('Permission to access camera is required!');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedImages(prev => [...prev, ...result.assets]);
        setPreviewBeforeUpload(true); // Show preview before upload
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      alert('Failed to take photo: ' + error.message);
    }
  };

  // Delete an image from a batch
  const handleDeleteImage = async (imageId) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      // Updated endpoint to match Django's URL pattern
      const response = await fetch(`${API_URL}/media/${imageId}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        },
      });

      if (response.ok) {
        // Refresh the selected batch data
        if (selectedBatch) {
          const updatedBatch = {
            ...selectedBatch,
            images: selectedBatch.images.filter(img => img.id !== imageId)
          };
          setSelectedBatch(updatedBatch);
        }
        fetchBatches();
        alert('Image deleted successfully!');
      } else {
        const errorData = await response.text();
        throw new Error(errorData || 'Failed to delete image');
      }
    } catch (error) {
      console.error('Error deleting image:', error);
      alert('Failed to delete image: ' + error.message);
    }
  };

  // Delete a batch (admin only)
  const handleDeleteBatch = async (batchId) => {
    try {
      // Check if user is admin before allowing deletion
      const isAdmin = await AsyncStorage.getItem('isAdmin');

      if (isAdmin !== 'true') {
        alert('Only administrators can delete batches');
        return;
      }

      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const response = await fetch(`${API_URL}/batches/${batchId}/`, {
        method: 'DELETE',
        headers: { Authorization: `Token ${token}` },
      });

      if (response.ok) {
        fetchBatches();
        setModalVisible(false);
        alert('Batch deleted successfully!');
      } else {
        const errorData = await response.text();
        throw new Error(errorData || 'Failed to delete batch');
      }
    } catch (error) {
      console.error('Error deleting batch:', error);
      alert('Failed to delete batch: ' + error.message);
    }
  };

  // Export batch as PDF
  const handleExportPDF = async (batchId) => {
    try {
      setUploading(true);

      // Get the selected batch
      const batch = batches.find(b => b.id === batchId);
      if (!batch) {
        throw new Error('Batch not found');
      }

      // Create HTML content for the PDF
      let htmlContent = `
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
            <style>
              body { font-family: 'Helvetica'; margin: 20px; }
              h1 { color: #333; font-size: 24px; text-align: center; }
              .batch-info { margin-bottom: 20px; border: 1px solid #ddd; padding: 10px; }
              .image-grid { display: flex; flex-wrap: wrap; }
              .image-container { width: 45%; margin: 2.5%; }
              img { width: 100%; height: auto; border: 1px solid #ccc; }
              .info-row { margin-bottom: 5px; }
              .label { font-weight: bold; }
            </style>
          </head>
          <body>
            <h1>Batch Report</h1>
            <div class="batch-info">
              <div class="info-row"><span class="label">Batch ID:</span> ${batch.referral_id || 'N/A'}</div>
              <div class="info-row"><span class="label">Title:</span> ${batch.title || 'N/A'}</div>
              <div class="info-row"><span class="label">Created:</span> ${batch.created_at ? new Date(batch.created_at).toLocaleString() : 'N/A'}</div>
              <div class="info-row"><span class="label">Owner:</span> ${batch.owner?.username || 'Unknown'}</div>
              <div class="info-row"><span class="label">Total Images:</span> ${batch.images?.length || 0}</div>
            </div>
            <div class="image-grid">
      `;

      // Add images to the HTML content
      if (batch.images && batch.images.length > 0) {
        // First, we need to download all images as base64
        const imagePromises = batch.images.map(async (image, index) => {
          try {
            const imageUrl = image.file_url || image.url;
            if (!imageUrl) return null;

            // Download the image and convert to base64
            const imageFilePath = `${FileSystem.cacheDirectory}temp_image_${index}.jpg`;
            await FileSystem.downloadAsync(imageUrl, imageFilePath);

            const base64 = await FileSystem.readAsStringAsync(imageFilePath, {
              encoding: FileSystem.EncodingType.Base64
            });

            return {
              index,
              base64
            };
          } catch (error) {
            console.error(`Error processing image ${index}:`, error);
            return null;
          }
        });

        const imageResults = await Promise.all(imagePromises);

        // Add each image to the HTML
        imageResults.forEach(result => {
          if (result) {
            htmlContent += `
              <div class="image-container">
                <img src="data:image/jpeg;base64,${result.base64}" />
                <p>Image ${result.index + 1}</p>
              </div>
            `;
          }
        });
      } else {
        htmlContent += `<p>No images in this batch</p>`;
      }

      // Close the HTML
      htmlContent += `
            </div>
          </body>
        </html>
      `;

      // Generate the PDF
      const { uri } = await Print.printToFileAsync({
        html: htmlContent,
        base64: false
      });

      // Share the PDF
      await shareAsync(uri, {
        UTI: '.pdf',
        mimeType: 'application/pdf'
      });

      alert('PDF generated successfully!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  // Upload additional images to an existing batch
  const uploadAdditionalImages = async () => {
    if (!selectedBatch) return;

    try {
      setUploading(true);
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const formData = new FormData();

      selectedImages.forEach(image => {
        const imageUri = image.uri;
        const filename = imageUri.split('/').pop();
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';

        formData.append('images', {
          uri: imageUri,
          name: filename,
          type
        });
      });

      const response = await fetch(`${API_URL}/batches/${selectedBatch.id}/images/`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`,
          // Content-Type header removed to let fetch set it automatically with boundary
        },
        body: formData
      });

      if (response.ok) {
        alert('Additional images uploaded successfully!');
        setSelectedImages([]);
        fetchBatches();
        // Refresh the selected batch by fetching it again
        const updatedResponse = await fetch(`${API_URL}/batches/${selectedBatch.id}/`, {
          headers: { Authorization: `Token ${token}` },
        });
        if (updatedResponse.ok) {
          const updatedBatch = await updatedResponse.json();
          setSelectedBatch(updatedBatch);
        }
        setPreviewBeforeUpload(false);
      } else {
        const errorData = await response.text();
        console.error('Upload error:', errorData);
        throw new Error('Failed to upload additional images');
      }
    } catch (error) {
      console.error('Error uploading additional images:', error);
      alert('Failed to upload additional images: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  // Cancel upload and reset state
  const cancelUpload = () => {
    setSelectedImages([]);
    setPreviewBeforeUpload(false);
  };

  // Fetch batches on component mount
  useEffect(() => {
    fetchBatches();
  }, []);

  // Update filtered batches when batches change
  useEffect(() => {
    if (batches && batches.length > 0) {
      setFilteredBatches(batches);
    }
  }, [batches]);

  // Render a batch item in the list
  const renderBatchItem = ({ item, index }) => (
    <View style={styles.batchRow}>
      <Text style={styles.serialNumber}>{index + 1}</Text>
      <View style={styles.batchInfo}>
        <Text style={styles.referralId}>ID: {item.referral_id || 'N/A'}</Text>
        <Text style={styles.batchTitle}>Title: {item.title || 'Untitled'}</Text>
        <Text style={styles.imageCount}>Images: {item.images?.length || 0}</Text>
        <Text style={styles.uploadedBy}>Uploaded by: {item.owner?.username || 'Unknown'}</Text>
      </View>
      <View style={styles.actionButtons}>
        <TouchableOpacity onPress={() => handleViewBatch(item)}>
          <Ionicons name="eye" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>
    </View>
  );

  // Main render
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Batch Upload</Text>
        <TouchableOpacity onPress={handleRefresh} style={styles.refreshButton} disabled={loading}>
          <Ionicons name="refresh" size={24} color={loading ? "#cccccc" : "#007AFF"} />
        </TouchableOpacity>
      </View>

      {/* Search box and date picker */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by title or ID"
            value={searchQuery}
            onChangeText={handleSearch}
          />
        </View>

        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => setShowDatePicker(true)}
        >
          <Ionicons name="calendar" size={20} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {isDateSelected && (
        <View style={styles.dateFilterContainer}>
          <Text style={styles.dateFilterText}>
            Date: {selectedDate.toLocaleDateString()}
          </Text>
          <TouchableOpacity onPress={clearDateFilter}>
            <Ionicons name="close-circle" size={20} color="#FF3B30" />
          </TouchableOpacity>
        </View>
      )}

      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display="default"
          onChange={handleDateChange}
        />
      )}

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Enter batch title"
          value={batchTitle}
          onChangeText={setBatchTitle}
        />

        <TouchableOpacity
          style={[
            styles.button,
            styles.uploadButton,
            (!batchTitle.trim() || uploading) && styles.disabledButton,
            { marginTop: 10 }
          ]}
          onPress={uploadBatch}
          disabled={uploading || !batchTitle.trim()}
        >
          {uploading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Ionicons name="cloud-upload" size={24} color="#fff" />
          )}
        </TouchableOpacity>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </View>

      <View style={styles.listContainer}>
        <Text style={styles.listTitle}>Uploaded Batches</Text>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
          </View>
        ) : filteredBatches.length > 0 ? (
          <FlatList
            data={filteredBatches}
            renderItem={renderBatchItem}
            keyExtractor={item => item.id?.toString() || Math.random().toString()}
          />
        ) : (
          <Text style={styles.noDataText}>No batches found</Text>
        )}
      </View>

      {/* Batch Detail Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              Batch: {selectedBatch?.referral_id || 'N/A'}
            </Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>

          {/* Preview Before Upload Modal */}
          {previewBeforeUpload && (
            <View style={styles.previewContainer}>
              <Text style={styles.previewTitle}>Preview Images Before Upload</Text>
              <ScrollView horizontal={true} style={styles.previewScroll}>
                {selectedImages.map((image, index) => (
                  <View key={index} style={styles.previewImageContainer}>
                    <Image
                      source={{ uri: image.uri }}
                      style={styles.previewImage}
                    />
                  </View>
                ))}
              </ScrollView>
              <View style={styles.previewButtons}>
                <TouchableOpacity
                  style={[styles.previewButton, styles.cancelButton]}
                  onPress={cancelUpload}
                >
                  <Text style={styles.previewButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.previewButton,
                    styles.confirmButton,
                    uploading && styles.disabledButton
                  ]}
                  onPress={uploadAdditionalImages}
                  disabled={uploading}
                >
                  {uploading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.previewButtonText}>Confirm Upload</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}

          {!previewBeforeUpload && (
            <>
              <ScrollView style={styles.modalContent}>
                <View style={styles.batchDetails}>
                  <Text style={styles.batchDetailText}>Title: {selectedBatch?.title || 'Untitled'}</Text>
                  <Text style={styles.batchDetailText}>Created: {selectedBatch?.created_at ? new Date(selectedBatch.created_at).toLocaleString() : 'Unknown'}</Text>
                  <Text style={styles.batchDetailText}>Images: {selectedBatch?.images?.length || 0}</Text>
                </View>

                <View style={styles.imageGrid}>
                  {selectedBatch?.images?.length > 0 ? (
                    selectedBatch.images.map((image, index) => {
                      const imageUrl = image.file_url || image.url;
                      return (
                        <View key={index} style={styles.imageContainer}>
                          <TouchableOpacity onPress={() => handleImagePreview(image)}>
                            <Image
                              source={{ uri: imageUrl }}
                              style={styles.batchImage}
                              onError={(e) => console.log('Image loading error:', e.nativeEvent.error)}
                            />
                            <View style={styles.previewOverlay}>
                              <Ionicons name="eye" size={20} color="#fff" />
                            </View>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.deleteImageButton}
                            onPress={() => handleDeleteImage(image.id)}
                          >
                            <Ionicons name="trash" size={20} color="#FF3B30" />
                          </TouchableOpacity>
                        </View>
                      );
                    })
                  ) : (
                    <Text style={styles.noImagesText}>No images in this batch</Text>
                  )}
                </View>
              </ScrollView>

              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={[styles.footerButton, styles.addButton]}
                  onPress={handleAddMoreImages}
                >
                  <Ionicons name="images" size={24} color="#fff" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.footerButton, styles.cameraButton]}
                  onPress={handleTakePhoto}
                >
                  <Ionicons name="camera" size={24} color="#fff" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.footerButton, styles.exportButton]}
                  onPress={() => handleExportPDF(selectedBatch?.id)}
                >
                  <Ionicons name="document" size={24} color="#fff" />
                </TouchableOpacity>

                {/* Add delete batch button for admins */}
                <TouchableOpacity
                  style={[styles.footerButton, styles.deleteButton]}
                  onPress={() => handleDeleteBatch(selectedBatch?.id)}
                >
                  <Ionicons name="trash" size={24} color="#fff" />
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </Modal>

      {/* Full Image View Modal */}
      <Modal
        visible={fullImageVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setFullImageVisible(false)}
      >
        <View style={styles.fullImageContainer}>
          <TouchableOpacity
            style={styles.closeFullImageButton}
            onPress={() => setFullImageVisible(false)}
          >
            <Ionicons name="close-circle" size={30} color="#fff" />
          </TouchableOpacity>
          {previewImage && (
            <Image
              source={{ uri: previewImage.file_url || previewImage.url }}
              style={styles.fullImage}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>

      {/* Upload button for selected images */}
      {selectedImages.length > 0 && !modalVisible && (
        <TouchableOpacity
          style={[
            styles.footerButton,
            styles.uploadButton,
            styles.floatingButton,
            uploading && styles.disabledButton
          ]}
          onPress={uploadAdditionalImages}
          disabled={uploading}
        >
          {uploading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Ionicons name="cloud-upload" size={24} color="#fff" />
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  refreshButton: {
    padding: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    marginBottom: 15,
    alignItems: 'center',
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    paddingVertical: 8,
  },
  dateButton: {
    marginLeft: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
  },
  dateFilterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    padding: 8,
    borderRadius: 8,
    marginBottom: 15,
  },
  dateFilterText: {
    flex: 1,
    marginRight: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 11,
  },
  input: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    paddingHorizontal: 10,
    marginRight: 10,
  },
  errorText: {
    color: 'red',
    marginVertical: 10,
  },
  button: {
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  uploadButton: {
    backgroundColor: '#007AFF',
    width: 50,
    height: 50,
    borderRadius: 25,
    alignSelf: 'center',
  },
  disabledButton: {
    backgroundColor: '#CCCCCC',
  },
  listContainer: {
    flex: 1,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noDataText: {
    textAlign: 'center',
    marginTop: 30,
    color: '#666',
  },
  batchRow: {
    flexDirection: 'row',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    alignItems: 'center',
  },
  serialNumber: {
    width: 30,
    fontWeight: 'bold',
  },
  batchInfo: {
    flex: 1,
    paddingHorizontal: 10,
  },
  batchTitle: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  referralId: {
    color: '#555',
  },
  imageCount: {
    color: '#777',
    fontSize: 14,
  },
  uploadedBy: {
    color: '#777',
    fontSize: 14,
    fontStyle: 'italic',
  },
  actionButtons: {
    flexDirection: 'row',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalContent: {
    flex: 1,
    padding: 15,
  },
  batchDetails: {
    marginBottom: 20,
    padding: 10,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  batchDetailText: {
    marginBottom: 5,
    fontSize: 14,
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  imageContainer: {
    width: '48%',
    marginBottom: 15,
    position: 'relative',
  },
  batchImage: {
    width: '100%',
    height: 120,
    borderRadius: 8,
  },
  previewOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -10 }, { translateY: -10 }],
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 15,
    padding: 5,
  },
  deleteImageButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 15,
    padding: 5,
  },
  noImagesText: {
    textAlign: 'center',
    marginTop: 20,
    color: '#666',
    width: '100%',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  footerButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButton: {
    backgroundColor: '#32CD32',
  },
  cameraButton: {
    backgroundColor: '#FF9500',
  },
  exportButton: {
    backgroundColor: '#5856D6',
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
  },
  fullImageContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImage: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height * 0.8,
  },
  closeFullImageButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 10,
  },
  previewContainer: {
    flex: 1,
    padding: 15,
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  previewScroll: {
    flexGrow: 0,
    height: 150,
    marginBottom: 20,
  },
  previewImageContainer: {
    width: 120,
    height: 120,
    marginRight: 10,
  },
  previewImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  previewButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  previewButton: {
    flex: 1,
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#FF3B30',
  },
  confirmButton: {
    backgroundColor: '#32CD32',
  },
  previewButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  floatingButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
  }
});