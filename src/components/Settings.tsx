import React, { useState, useEffect } from 'react';
import { ref, set, get, onValue, off } from 'firebase/database';
import { database } from '../firebase';
import { 
  Save, 
  RefreshCw, 
  Image, 
  Globe, 
  DollarSign,
  Upload,
  Trash2,
  ArrowUp,
  ArrowDown,
  Eye,
  Shield,
  MessageCircle
} from 'lucide-react';

interface DeviceRestrictions {
  maxAccountsPerDevice: number;
  enabled: boolean;
  lastUpdated: string;
  updatedBy: string;
}

interface SliderImage {
  id: string;
  url: string;
  alt: string;
  order: number;
  createdAt: string;
}

interface AppConfig {
  logoUrl: string;
  appName: string;
  sliderImages: SliderImage[];
  supportUrl: string;
  tutorialVideoId: string;
  referralCommissionRate?: number;
}

const AdminPanel: React.FC = () => {
  // State for device restrictions
  const [, setDeviceRestrictions] = useState<DeviceRestrictions>({
    maxAccountsPerDevice: 2,
    enabled: true,
    lastUpdated: new Date().toISOString(),
    updatedBy: 'admin'
  });
  
  // State for app configuration
  const [appConfig, setAppConfig] = useState<AppConfig>({
    logoUrl: "",
    appName: "PRIME V1",
    sliderImages: [],
    supportUrl: "https://t.me/YourChannelName",
    tutorialVideoId: "dQw4w9WgXcQ",
    referralCommissionRate: 10
  });

  // Form states
  const [maxAccounts, setMaxAccounts] = useState(2);
  const [restrictionsEnabled, setRestrictionsEnabled] = useState(true);
  const [commissionRate, setCommissionRate] = useState(10);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [sliderFiles, setSliderFiles] = useState<File[]>([]);
  
  // UI states
  const [isLoading, setIsLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [activeTab, setActiveTab] = useState<'restrictions' | 'commission' | 'branding' | 'support'>('restrictions');

  // Firebase operations
  const adminFirebase = {
    getDeviceRestrictions: async (): Promise<DeviceRestrictions> => {
      try {
        const restrictionsRef = ref(database, 'deviceRestrictions');
        const snapshot = await get(restrictionsRef);
        if (snapshot.exists()) return snapshot.val();
        const defaultRestrictions: DeviceRestrictions = {
          maxAccountsPerDevice: 2,
          enabled: true,
          lastUpdated: new Date().toISOString(),
          updatedBy: 'system'
        };
        await set(restrictionsRef, defaultRestrictions);
        return defaultRestrictions;
      } catch (error) {
        console.error('Error getting device restrictions:', error);
        throw error;
      }
    },

    updateDeviceRestrictions: async (updates: Partial<DeviceRestrictions>): Promise<boolean> => {
      try {
        const restrictionsRef = ref(database, 'deviceRestrictions');
        const snapshot = await get(restrictionsRef);
        const currentRestrictions = snapshot.exists() ? snapshot.val() : {};
        const updatedRestrictions = {
          ...currentRestrictions,
          ...updates,
          lastUpdated: new Date().toISOString(),
          updatedBy: 'admin'
        };
        await set(restrictionsRef, updatedRestrictions);
        return true;
      } catch (error) {
        console.error('Error updating device restrictions:', error);
        return false;
      }
    },

    getAppConfig: async (): Promise<AppConfig> => {
      try {
        const configRef = ref(database, 'appConfig');
        const snapshot = await get(configRef);
        if (snapshot.exists()) return snapshot.val();
        const defaultConfig: AppConfig = {
          logoUrl: "",
          appName: "PRIME V1",
          sliderImages: [],
          supportUrl: "https://t.me/YourChannelName",
          tutorialVideoId: "dQw4w9WgXcQ",
          referralCommissionRate: 10
        };
        await set(configRef, defaultConfig);
        return defaultConfig;
      } catch (error) {
        console.error('Error getting app config:', error);
        throw error;
      }
    },

    updateAppConfig: async (updates: Partial<AppConfig>): Promise<boolean> => {
      try {
        const configRef = ref(database, 'appConfig');
        const snapshot = await get(configRef);
        const currentConfig = snapshot.exists() ? snapshot.val() : {};
        const updatedConfig = { ...currentConfig, ...updates };
        await set(configRef, updatedConfig);
        return true;
      } catch (error) {
        console.error('Error updating app config:', error);
        return false;
      }
    }
  };

  // Cloudinary upload function
  const uploadToCloudinary = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'ml_default');
    formData.append('cloud_name', 'deu1ngeov');
    formData.append('api_key', '872479185859578');

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/deu1ngeov/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error(`Upload failed with status: ${response.status}`);
      }

      const data = await response.json();
      return data.secure_url;
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      throw new Error(`Failed to upload image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Load initial data
  useEffect(() => {
    loadAllData();

    const restrictionsRef = ref(database, 'deviceRestrictions');
    const configRef = ref(database, 'appConfig');

    const unsubscribeRestrictions = onValue(restrictionsRef, (snapshot) => {
      if (snapshot.exists()) {
        const restrictions = snapshot.val();
        setDeviceRestrictions(restrictions);
        setMaxAccounts(restrictions.maxAccountsPerDevice || 2);
        setRestrictionsEnabled(restrictions.enabled !== false);
      }
    });

    const unsubscribeConfig = onValue(configRef, (snapshot) => {
      if (snapshot.exists()) {
        const config = snapshot.val();
        setAppConfig(config);
        setCommissionRate(config.referralCommissionRate || 10);
      }
    });

    return () => {
      off(restrictionsRef, 'value', unsubscribeRestrictions);
      off(configRef, 'value', unsubscribeConfig);
    };
  }, []);

  const loadAllData = async () => {
    try {
      setIsLoading(true);
      const [restrictions, config] = await Promise.all([
        adminFirebase.getDeviceRestrictions(),
        adminFirebase.getAppConfig()
      ]);
      
      setDeviceRestrictions(restrictions);
      setMaxAccounts(restrictions.maxAccountsPerDevice);
      setRestrictionsEnabled(restrictions.enabled);
      setAppConfig(config);
      setCommissionRate(config.referralCommissionRate || 10);
    } catch (error) {
      console.error('Error loading data:', error);
      setMessage('Error loading configuration data');
    } finally {
      setIsLoading(false);
    }
  };

  // Device Restrictions Handlers
  const handleSaveRestrictions = async () => {
    try {
      setSaveStatus('saving');
      const success = await adminFirebase.updateDeviceRestrictions({
        maxAccountsPerDevice: maxAccounts,
        enabled: restrictionsEnabled
      });
      
      if (success) {
        setSaveStatus('success');
        setMessage('Device restrictions updated successfully!');
        setTimeout(() => {
          setSaveStatus('idle');
          setMessage('');
        }, 3000);
      } else {
        setSaveStatus('error');
        setMessage('Failed to update device restrictions. Please try again.');
      }
    } catch (error) {
      console.error('Error saving restrictions:', error);
      setSaveStatus('error');
      setMessage('Error saving device restrictions.');
    }
  };

  const handleResetRestrictions = async () => {
    if (!confirm('Are you sure you want to reset device restrictions to default values?')) return;
    
    try {
      setSaveStatus('saving');
      const success = await adminFirebase.updateDeviceRestrictions({
        maxAccountsPerDevice: 2,
        enabled: true
      });
      
      if (success) {
        setSaveStatus('success');
        setMessage('Device restrictions reset to default values successfully!');
        setTimeout(() => {
          setSaveStatus('idle');
          setMessage('');
        }, 3000);
      } else {
        setSaveStatus('error');
        setMessage('Failed to reset device restrictions.');
      }
    } catch (error) {
      console.error('Error resetting restrictions:', error);
      setSaveStatus('error');
      setMessage('Error resetting device restrictions.');
    }
  };

  // Commission Rate Handler
  const handleSaveCommission = async () => {
    if (commissionRate < 0 || commissionRate > 100) {
      setMessage('Commission rate must be between 0 and 100');
      return;
    }

    try {
      setIsLoading(true);
      const success = await adminFirebase.updateAppConfig({
        referralCommissionRate: commissionRate
      });
      
      if (success) {
        setMessage('Commission rate updated successfully!');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage('Failed to update commission rate');
      }
    } catch (error) {
      console.error('Error updating commission rate:', error);
      setMessage('Error updating commission rate');
    } finally {
      setIsLoading(false);
    }
  };

  // Branding Handlers
  const handleLogoUpload = async () => {
    if (!logoFile) return;

    setUploading(true);
    setMessage("");

    try {
      const imageUrl = await uploadToCloudinary(logoFile);
      const success = await adminFirebase.updateAppConfig({
        logoUrl: imageUrl
      });
      
      if (success) {
        setLogoFile(null);
        setMessage("Logo uploaded successfully!");
      } else {
        setMessage("Failed to update logo");
      }
    } catch (error) {
      console.error("Error uploading logo:", error);
      setMessage("Error uploading logo. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleSliderUpload = async () => {
    if (sliderFiles.length === 0) return;

    setUploading(true);
    setMessage("");
    setUploadProgress(0);

    try {
      const uploadedImages: SliderImage[] = [...(appConfig.sliderImages || [])];
      
      for (let i = 0; i < sliderFiles.length; i++) {
        const file = sliderFiles[i];
        const imageUrl = await uploadToCloudinary(file);
        
        const newImage: SliderImage = {
          id: `slider-${Date.now()}-${i}`,
          url: imageUrl,
          alt: `Slider Image ${uploadedImages.length + i + 1}`,
          order: uploadedImages.length + i,
          createdAt: new Date().toISOString()
        };
        
        uploadedImages.push(newImage);
        setUploadProgress(Math.round(((i + 1) / sliderFiles.length) * 100));
      }

      const success = await adminFirebase.updateAppConfig({
        sliderImages: uploadedImages
      });
      
      if (success) {
        setSliderFiles([]);
        setUploadProgress(0);
        setMessage(`${sliderFiles.length} slider images uploaded successfully!`);
      } else {
        setMessage("Failed to update slider images");
      }
    } catch (error) {
      console.error("Error uploading slider images:", error);
      setMessage("Error uploading slider images. Please try again.");
      setUploadProgress(0);
    } finally {
      setUploading(false);
    }
  };

  const removeSliderImage = async (imageId: string) => {
    try {
      const currentImages = appConfig.sliderImages || [];
      const updatedSliderImages = currentImages.filter(img => img.id !== imageId)
        .map((img, index) => ({
          ...img,
          order: index
        }));
      
      const success = await adminFirebase.updateAppConfig({
        sliderImages: updatedSliderImages
      });
      
      if (success) {
        setMessage("Slider image removed successfully!");
      } else {
        setMessage("Failed to remove slider image");
      }
    } catch (error) {
      console.error("Error removing slider image:", error);
      setMessage("Error removing slider image. Please try again.");
    }
  };

  const moveSliderImage = async (imageId: string, direction: 'up' | 'down') => {
    try {
      const currentImages = appConfig.sliderImages || [];
      const currentIndex = currentImages.findIndex(img => img.id === imageId);
      if (currentIndex === -1) return;

      const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      if (newIndex < 0 || newIndex >= currentImages.length) return;

      const updatedSliderImages = [...currentImages];
      const [movedImage] = updatedSliderImages.splice(currentIndex, 1);
      updatedSliderImages.splice(newIndex, 0, movedImage);
      
      const reorderedImages = updatedSliderImages.map((img, index) => ({
        ...img,
        order: index
      }));

      const success = await adminFirebase.updateAppConfig({
        sliderImages: reorderedImages
      });
      
      if (success) {
        setMessage(`Slider image moved ${direction} successfully!`);
      } else {
        setMessage("Failed to move slider image");
      }
    } catch (error) {
      console.error("Error moving slider image:", error);
      setMessage("Error moving slider image. Please try again.");
    }
  };

  const handleAppNameUpdate = async () => {
    if (!appConfig.appName.trim()) {
      setMessage("App name cannot be empty!");
      return;
    }

    try {
      const success = await adminFirebase.updateAppConfig({
        appName: appConfig.appName
      });
      
      if (success) {
        setMessage("App name updated successfully!");
      } else {
        setMessage("Failed to update app name");
      }
    } catch (error) {
      console.error("Error updating app name:", error);
      setMessage("Error updating app name. Please try again.");
    }
  };

  const handleSupportTutorialUpdate = async () => {
    try {
      const success = await adminFirebase.updateAppConfig({
        supportUrl: appConfig.supportUrl,
        tutorialVideoId: appConfig.tutorialVideoId
      });
      
      if (success) {
        setMessage("Support & Tutorial settings updated successfully!");
      } else {
        setMessage("Failed to update support & tutorial settings");
      }
    } catch (error) {
      console.error("Error updating support & tutorial settings:", error);
      setMessage("Error updating settings. Please try again.");
    }
  };

  const clearAllSliders = async () => {
    if (!confirm("Are you sure you want to remove all slider images?")) return;
    
    try {
      const success = await adminFirebase.updateAppConfig({
        sliderImages: []
      });
      
      if (success) {
        setMessage("All slider images removed successfully!");
      } else {
        setMessage("Failed to clear slider images");
      }
    } catch (error) {
      console.error("Error clearing slider images:", error);
      setMessage("Error clearing slider images. Please try again.");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      if (!file.type.startsWith('image/')) {
        setMessage("Please select a valid image file.");
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        setMessage("Image size should be less than 5MB.");
        return;
      }
      
      setLogoFile(file);
      setMessage("");
    }
  };

  const handleSliderFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      
      for (const file of files) {
        if (!file.type.startsWith('image/')) {
          setMessage("Please select valid image files only.");
          return;
        }
        
        if (file.size > 5 * 1024 * 1024) {
          setMessage("Each image should be less than 5MB.");
          return;
        }
      }
      
      setSliderFiles(files);
      setMessage("");
    }
  };

  const handleInputChange = (field: keyof AppConfig, value: string) => {
    setAppConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Tab Components
  const renderDeviceRestrictionsTab = () => (
    <div className="space-y-6">
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white flex items-center">
            <Shield className="w-5 h-5 mr-2 text-blue-400" />
            Device Restrictions Configuration
          </h3>
          <div className={`px-3 py-1 rounded-full text-xs font-medium ${
            saveStatus === 'success' ? 'bg-green-500/20 text-green-400' :
            saveStatus === 'error' ? 'bg-red-500/20 text-red-400' :
            saveStatus === 'saving' ? 'bg-blue-500/20 text-blue-400' :
            'bg-gray-500/20 text-gray-400'
          }`}>
            {saveStatus === 'success' ? 'Saved!' :
             saveStatus === 'error' ? 'Error!' :
             saveStatus === 'saving' ? 'Saving...' : 'Ready'}
          </div>
        </div>

        <div className="space-y-6">

          <div className="p-4 bg-white/5 rounded-xl">
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Maximum Accounts Per Device
            </label>
            <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
              <div className="flex items-center space-x-3">
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={maxAccounts}
                  onChange={(e) => setMaxAccounts(parseInt(e.target.value))}
                  disabled={!restrictionsEnabled}
                  className="w-32 accent-blue-500 disabled:opacity-50"
                />
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={maxAccounts}
                  onChange={(e) => setMaxAccounts(parseInt(e.target.value) || 1)}
                  disabled={!restrictionsEnabled}
                  className="w-20 text-center font-bold text-white bg-gray-800 border border-gray-600 rounded-lg 
                    focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                />
                <span className="text-sm text-gray-400">accounts</span>
              </div>
            </div>
            <div className="text-xs text-gray-500 mt-2">
              Current setting: {maxAccounts} account{maxAccounts !== 1 ? 's' : ''} per device
            </div>
          </div>

          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
            <button
              onClick={handleSaveRestrictions}
              disabled={saveStatus === 'saving' || isLoading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white font-semibold py-3 px-4 rounded-xl transition-colors duration-200 flex items-center justify-center space-x-2"
            >
              {saveStatus === 'saving' ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <Save className="w-5 h-5" />
              )}
              <span>{saveStatus === 'saving' ? 'Saving Changes...' : 'Save Restrictions'}</span>
            </button>

            <button
              onClick={handleResetRestrictions}
              disabled={saveStatus === 'saving'}
              className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-4 rounded-xl transition-colors duration-200 flex items-center justify-center space-x-2"
            >
              <RefreshCw className="w-5 h-5" />
              <span>Reset to Default</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCommissionTab = () => (
    <div className="space-y-6">
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-white flex items-center mb-6">
          <DollarSign className="w-5 h-5 mr-2 text-green-400" />
          Referral Commission Settings
        </h3>

        <div className="space-y-6">
          <div className="p-4 bg-white/5 rounded-xl">
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Commission Rate (%)
            </label>
            <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
              <div className="flex items-center space-x-3">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={commissionRate}
                  onChange={(e) => setCommissionRate(parseInt(e.target.value))}
                  className="w-32 accent-green-500"
                />
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={commissionRate}
                  onChange={(e) => setCommissionRate(parseInt(e.target.value) || 0)}
                  className="w-24 text-center font-bold text-white bg-gray-800 border border-gray-600 rounded-lg 
                    focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <span className="text-sm text-gray-400">%</span>
              </div>
            </div>
            <div className="text-xs text-gray-500 mt-2">
              Current rate: {commissionRate}% commission on referrals
            </div>
          </div>

          <button
            onClick={handleSaveCommission}
            disabled={isLoading}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-800 text-white font-semibold py-3 px-4 rounded-xl transition-colors duration-200 flex items-center justify-center space-x-2"
          >
            {isLoading ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : (
              <Save className="w-5 h-5" />
            )}
            <span>{isLoading ? 'Saving...' : 'Save Commission Rate'}</span>
          </button>
        </div>
      </div>
    </div>
  );

  const renderBrandingTab = () => (
    <div className="space-y-6">
      {/* Logo Upload */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-white flex items-center mb-6">
          <Image className="w-5 h-5 mr-2 text-purple-400" />
          Logo Management
        </h3>

        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-6">
            <div className="flex-shrink-0">
              <label className="block text-sm font-medium text-gray-300 mb-2">Current Logo:</label>
              {appConfig.logoUrl ? (
                <img 
                  src={appConfig.logoUrl} 
                  alt="Current Logo" 
                  className="w-20 h-20 object-cover rounded-full border-2 border-purple-400"
                />
              ) : (
                <div className="w-20 h-20 rounded-full border-2 border-dashed border-gray-600 flex items-center justify-center">
                  <span className="text-gray-400 text-xs">No logo</span>
                </div>
              )}
            </div>

            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-300 mb-2">Upload New Logo:</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-400
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-full file:border-0
                  file:text-sm file:font-semibold
                  file:bg-purple-500 file:text-white
                  hover:file:bg-purple-600
                  bg-gray-700 rounded-lg p-2"
              />
              <p className="text-xs text-gray-400 mt-1">
                Supported formats: JPG, PNG, GIF. Max size: 5MB
              </p>
            </div>
          </div>

          <button
            onClick={handleLogoUpload}
            disabled={!logoFile || uploading}
            className="bg-purple-500 hover:bg-purple-600 text-white font-semibold py-3 px-6 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition duration-200 flex items-center justify-center space-x-2"
          >
            {uploading ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : (
              <Upload className="w-5 h-5" />
            )}
            <span>{uploading ? 'Uploading...' : 'Upload Logo'}</span>
          </button>
        </div>
      </div>

      {/* Slider Images */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <h3 className="text-lg font-semibold text-white flex items-center mb-4 sm:mb-0">
            <Image className="w-5 h-5 mr-2 text-orange-400" />
            Slider Images Management
          </h3>
          {appConfig.sliderImages && appConfig.sliderImages.length > 0 && (
            <button
              onClick={clearAllSliders}
              className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg transition duration-200 flex items-center space-x-2"
            >
              <Trash2 className="w-4 h-4" />
              <span>Clear All</span>
            </button>
          )}
        </div>

        <div className="space-y-6">
          {/* Current Slider Images */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Current Slider Images ({(appConfig.sliderImages || []).length})
            </label>
            
            {appConfig.sliderImages && appConfig.sliderImages.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {appConfig.sliderImages.sort((a, b) => a.order - b.order).map((image, index) => (
                  <div key={image.id} className="relative group bg-gray-700/50 rounded-xl p-4 border border-gray-600">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm text-gray-300 bg-gray-600 px-2 py-1 rounded">#{image.order + 1}</span>
                      <div className="flex space-x-1">
                        <button
                          onClick={() => moveSliderImage(image.id, 'up')}
                          disabled={index === 0}
                          className="p-1 bg-blue-500 hover:bg-blue-600 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Move up"
                        >
                          <ArrowUp className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => moveSliderImage(image.id, 'down')}
                          disabled={index === appConfig.sliderImages.length - 1}
                          className="p-1 bg-blue-500 hover:bg-blue-600 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Move down"
                        >
                          <ArrowDown className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    
                    <img 
                      src={image.url} 
                      alt={image.alt} 
                      className="w-full h-32 object-cover rounded-lg border-2 border-gray-600 mb-3"
                    />
                    
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-400 truncate flex-1 mr-2">
                        {image.alt}
                      </span>
                      <button
                        onClick={() => removeSliderImage(image.id)}
                        className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition duration-200"
                        title="Remove image"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 border-2 border-dashed border-gray-600 rounded-lg">
                <Image className="text-4xl text-gray-400 mx-auto mb-2" />
                <span className="text-gray-400">No slider images uploaded yet</span>
              </div>
            )}
          </div>

          {/* Upload Progress */}
          {uploading && uploadProgress > 0 && (
            <div className="bg-gray-700/50 rounded-lg p-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-300">Uploading images...</span>
                <span className="text-green-400">{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-600 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Upload New Slider Images */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Upload New Slider Images:</label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleSliderFilesChange}
              className="block w-full text-sm text-gray-400
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-orange-500 file:text-white
                hover:file:bg-orange-600
                bg-gray-700 rounded-lg p-2"
            />
            <p className="text-xs text-gray-400 mt-1">
              Select multiple images. Supported formats: JPG, PNG, GIF. Max size per image: 5MB
            </p>
            {sliderFiles.length > 0 && (
              <p className="text-orange-400 text-sm mt-2">
                {sliderFiles.length} image(s) selected for upload
              </p>
            )}
          </div>

          <button
            onClick={handleSliderUpload}
            disabled={sliderFiles.length === 0 || uploading}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-6 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition duration-200 flex items-center justify-center space-x-2"
          >
            {uploading ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : (
              <Upload className="w-5 h-5" />
            )}
            <span>
              {uploading ? 'Uploading...' : `Upload ${sliderFiles.length} Slider Image(s)`}
            </span>
          </button>
        </div>
      </div>

      {/* App Name */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-white flex items-center mb-6">
          <Globe className="w-5 h-5 mr-2 text-indigo-400" />
          App Configuration
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">App Name:</label>
            <input
              type="text"
              value={appConfig.appName}
              onChange={(e) => handleInputChange('appName', e.target.value)}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Enter app name"
            />
          </div>

          <button
            onClick={handleAppNameUpdate}
            disabled={!appConfig.appName.trim()}
            className="bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-3 px-6 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition duration-200 flex items-center justify-center space-x-2"
          >
            <Save className="w-5 h-5" />
            <span>Update App Name</span>
          </button>
        </div>
      </div>
    </div>
  );

  const renderSupportTab = () => (
    <div className="space-y-6">
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-white flex items-center mb-6">
          <MessageCircle className="w-5 h-5 mr-2 text-cyan-400" />
          Support & Tutorial Configuration
        </h3>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Support Telegram URL
            </label>
            <input
              type="text"
              value={appConfig.supportUrl || ''}
              onChange={(e) => handleInputChange('supportUrl', e.target.value)}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              placeholder="https://t.me/YourChannelName"
            />
            <p className="text-xs text-gray-400 mt-2">
              Enter the full Telegram URL for support
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              YouTube Tutorial Video ID
            </label>
            <input
              type="text"
              value={appConfig.tutorialVideoId || ''}
              onChange={(e) => handleInputChange('tutorialVideoId', e.target.value)}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              placeholder="dQw4w9WgXcQ"
            />
            <p className="text-xs text-gray-400 mt-2">
              Enter only the YouTube video ID (the part after "v=" in the URL)
            </p>
          </div>

          <button
            onClick={handleSupportTutorialUpdate}
            className="w-full bg-cyan-500 hover:bg-cyan-600 text-white font-semibold py-3 px-6 rounded-xl transition duration-200 flex items-center justify-center space-x-2"
          >
            <Save className="w-5 h-5" />
            <span>Update Support & Tutorial</span>
          </button>
        </div>
      </div>

      {/* Live Preview */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-white flex items-center mb-6">
          <Eye className="w-5 h-5 mr-2 text-yellow-400" />
          Live Preview
        </h3>

        <div className="bg-gray-900 p-6 rounded-xl border border-gray-700 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="rounded-3xl bg-[#0a1a2b] border border-[#014983]/30 p-1">
                <img
                  src={appConfig.logoUrl || "https://res.cloudinary.com/deu1ngeov/image/upload/v1758400527/slide3_lds1l1.jpg"}
                  alt="logo preview"
                  className="w-10 h-10 object-cover rounded-full"
                />
              </div>
              <p className="text-sm text-blue-400 font-medium">{appConfig.appName || "PRIME V1"}</p>
            </div>
            
            <div className="flex items-center border-2 border-[#014983]/40 rounded-full px-4 py-1 bg-[#0a1a2b]">
              <div className="h-6 w-px bg-[#014983]/40 mx-2"></div>
              <div className="flex-1 text-center">
                <p className="text-xs text-blue-300 font-medium">Balance</p>
                <p className="text-sm text-green-500 font-semibold">USDT 0.00</p>
              </div>
            </div>
          </div>

          {/* Slider Preview */}
          {appConfig.sliderImages && appConfig.sliderImages.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-3 text-blue-300">Slider Preview:</h4>
              <div className="grid grid-cols-2 gap-3">
                {appConfig.sliderImages.slice(0, 2).map((image, index) => (
                  <img
                    key={image.id}
                    src={image.url}
                    alt={`Slider Preview ${index + 1}`}
                    className="w-full h-24 object-cover rounded-lg border border-gray-600"
                  />
                ))}
              </div>
              {appConfig.sliderImages.length > 2 && (
                <p className="text-xs text-gray-400 mt-2 text-center">
                  +{appConfig.sliderImages.length - 2} more images
                </p>
              )}
            </div>
          )}

          {/* Support & Tutorial Preview */}
          <div>
            <h4 className="text-sm font-medium mb-3 text-blue-300">Support & Tutorial:</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Support URL:</span>
                <span className="text-blue-300 truncate max-w-[200px]">
                  {appConfig.supportUrl || "Not configured"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Tutorial Video ID:</span>
                <span className="text-blue-300">
                  {appConfig.tutorialVideoId || "Not configured"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8 space-y-4 lg:space-y-0">
          <div>
            <h1 className="text-3xl font-bold text-white">Admin Panel</h1>
            <p className="text-gray-400">Complete Application Configuration</p>
          </div>
          <div className="bg-blue-500/10 border border-blue-400/30 rounded-2xl px-4 py-3">
            <div className="text-blue-300 text-sm flex items-center">
              <RefreshCw className="w-4 h-4 mr-2" />
              Live Updates Active
            </div>
            <div className="text-white font-semibold">Real-time Sync</div>
          </div>
        </div>

        {/* Message Display */}
        {message && (
          <div className={`mb-6 p-4 rounded-2xl ${
            message.includes('Error') || message.includes('Failed') 
              ? 'bg-red-500/20 border border-red-400/30 text-red-300' 
              : 'bg-green-500/20 border border-green-400/30 text-green-300'
          }`}>
            <div className="flex items-center">
              {message.includes('Error') || message.includes('Failed') ? (
                <Trash2 className="w-5 h-5 mr-2" />
              ) : (
                <Save className="w-5 h-5 mr-2" />
              )}
              {message}
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-2 mb-6">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveTab('restrictions')}
              className={`flex items-center space-x-2 px-4 py-3 rounded-xl transition-all duration-200 ${
                activeTab === 'restrictions' 
                  ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25' 
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>Device Restrictions</span>
            </button>
            <button
              onClick={() => setActiveTab('commission')}
              className={`flex items-center space-x-2 px-4 py-3 rounded-xl transition-all duration-200 ${
                activeTab === 'commission' 
                  ? 'bg-green-500 text-white shadow-lg shadow-green-500/25' 
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <DollarSign className="w-4 h-4" />
              <span>Commission</span>
            </button>
            <button
              onClick={() => setActiveTab('branding')}
              className={`flex items-center space-x-2 px-4 py-3 rounded-xl transition-all duration-200 ${
                activeTab === 'branding' 
                  ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/25' 
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Image className="w-4 h-4" />
              <span>Branding</span>
            </button>
            <button
              onClick={() => setActiveTab('support')}
              className={`flex items-center space-x-2 px-4 py-3 rounded-xl transition-all duration-200 ${
                activeTab === 'support' 
                  ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/25' 
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <MessageCircle className="w-4 h-4" />
              <span>Support & Tutorial</span>
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-6">
          {isLoading ? (
            <div className="text-center py-12">
              <RefreshCw className="w-12 h-12 animate-spin text-blue-400 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">Loading configuration...</p>
            </div>
          ) : (
            <>
              {activeTab === 'restrictions' && renderDeviceRestrictionsTab()}
              {activeTab === 'commission' && renderCommissionTab()}
              {activeTab === 'branding' && renderBrandingTab()}
              {activeTab === 'support' && renderSupportTab()}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;