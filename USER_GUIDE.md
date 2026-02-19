# TRUEVINE FELLOWSHIP Church App - User Guide & Content Management

## 📱 App Overview

The TRUEVINE FELLOWSHIP Church App is a comprehensive mobile application that brings your church community together through digital engagement. The app provides 24/7 access to sermons, articles, and church information, enabling spiritual growth and community connection.

### 🌟 Key Features

- **📖 Sermon Library**: Listen to sermons with advanced audio controls
- **📰 Article Collection**: Read spiritual articles and devotionals
- **🔍 Smart Search**: Find content by title, speaker, or topic
- **📱 Offline Access**: Download content for offline listening/reading
- **🌙 Dark Mode**: Automatic and manual theme switching
- **🔔 Push Notifications**: Stay updated with new content and reminders
- **📤 Content Sharing**: Share sermons and articles with friends
- **👤 User Profiles**: Personalized experience with saved content
- **📊 Analytics**: Track engagement and content performance

---

## 🚀 Getting Started

### For Church Members

#### 1. **Download & Install**
- Download from App Store (iOS) or Google Play Store (Android)
- Search for "TRUEVINE FELLOWSHIP" or visit [truevinefellowship.online](https://truevinefellowship.online)

#### 2. **First Launch**
- The app opens with a beautiful splash screen
- Choose to browse as a guest or create an account
- Guest users can access all published content
- Account holders get personalized features

#### 3. **Create Account (Optional)**
- Tap "Sign Up" on the welcome screen
- Enter your email and create a password
- Verify your email address
- Complete your profile with name and preferences

#### 4. **Explore the Dashboard**
- **Welcome Section**: Church greeting and quick actions
- **Recent Sermons**: Latest 3 sermons with filtering options
- **Latest Articles**: Recent articles with filtering options
- **Quick Actions**: Direct access to sermons, articles, and website

---

## 📱 App Navigation

### Main Tabs

#### 🏠 **Dashboard**
- **Purpose**: Main landing page with featured content
- **Features**:
  - Personalized greeting
  - Theme toggle (Light/Dark mode)
  - Quick action buttons
  - Recent sermons and articles
  - Filter options for content

#### 🎧 **Sermons**
- **Purpose**: Browse and listen to sermon recordings
- **Features**:
  - Advanced search and filtering
  - Audio player with controls
  - Download for offline listening
  - Share functionality
  - Progress tracking

#### 📰 **Articles**
- **Purpose**: Read spiritual articles and devotionals
- **Features**:
  - Article previews and full content
  - Search and filtering
  - Save for later reading
  - Share functionality
  - Reading progress

#### 🔔 **Notifications**
- **Purpose**: Manage notifications and reminders
- **Features**:
  - Push notification settings
  - Content reminders
  - Notification history
  - Custom notification preferences

#### 👤 **Profile**
- **Purpose**: User account and app settings
- **Features**:
  - Profile management
  - App preferences
  - Saved content
  - Download manager
  - Account settings

---

## 🎧 Using the Sermon Player

### Audio Controls
- **▶️ Play/Pause**: Start or pause playback
- **⏭️ Skip Forward**: Jump 15 seconds ahead
- **⏮️ Skip Backward**: Jump 15 seconds back
- **🔊 Volume**: Adjust audio volume
- **📊 Progress Bar**: Seek to any position
- **⏱️ Time Display**: Shows current time and duration

### Advanced Features
- **Background Playback**: Continue listening when app is minimized
- **Progress Memory**: Automatically resumes where you left off
- **Quality Selection**: Choose audio quality based on connection
- **Download Options**: Download for offline listening
- **Share Function**: Share sermon with friends

### Filtering Sermons
- **Time Filters**: This Week, Last Week, Last 2 Months, All Time
- **Search**: Find by title, preacher, or description
- **Categories**: Filter by sermon series or topics
- **Featured**: View highlighted sermons

---

## 📰 Reading Articles

### Article Features
- **Full Content**: Complete article text with formatting
- **Excerpt Preview**: Quick summary on listing pages
- **Author Information**: Article author and publication date
- **Thumbnail Images**: Visual content representation
- **Reading Progress**: Track how much you've read

### Article Management
- **Save for Later**: Bookmark articles to read later
- **Share**: Send articles via social media or messaging
- **Search**: Find articles by title, author, or content
- **Filter**: Sort by date, author, or category

---

## 🔍 Search & Discovery

### Search Functionality
- **Global Search**: Search across all sermons and articles
- **Content-Specific Search**: Search only sermons or only articles
- **Advanced Filters**: Combine search with category and date filters
- **Recent Searches**: Quick access to previous searches

### Content Organization
- **Categories**: Organized by series, topics, and themes
- **Tags**: Detailed content tagging system
- **Featured Content**: Highlighted sermons and articles
- **Recent Content**: Latest additions to the library

---

## 📱 Offline Features

### Download Management
- **Download Sermons**: Save audio files for offline listening
- **Download Articles**: Save articles for offline reading
- **Storage Management**: Monitor device storage usage
- **Sync Status**: Track download progress and completion

### Offline Access
- **Downloaded Content**: Access without internet connection
- **Progress Sync**: Sync progress when back online
- **Automatic Updates**: Update downloaded content when available
- **Storage Optimization**: Manage storage efficiently

---

## 🔔 Notifications & Reminders

### Push Notifications
- **New Content**: Alerts for new sermons and articles
- **Reminders**: Custom reminders for specific content
- **Church Updates**: Important announcements and events
- **Marketing**: Optional promotional content (can be disabled)

### Reminder System
- **Content Reminders**: Set reminders for specific sermons or articles
- **Custom Messages**: Add personal notes to reminders
- **Scheduling**: Choose date and time for reminders
- **Management**: View and edit all active reminders

---

## 👤 Profile & Settings

### User Profile
- **Personal Information**: Name, email, and profile picture
- **Account Settings**: Password, email preferences
- **Privacy Settings**: Control data sharing and visibility
- **Account Management**: Delete account if needed

### App Preferences
- **Theme**: Light, Dark, or Auto (system-based)
- **Audio Quality**: Low, Medium, or High quality settings
- **Auto-Download**: Automatically download new content
- **Language**: App language preferences
- **Notifications**: Detailed notification preferences

### Saved Content
- **Saved Sermons**: List of bookmarked sermons
- **Saved Articles**: List of bookmarked articles
- **Favorites**: Marked favorite content
- **Recently Viewed**: History of accessed content

---

## 📤 Sharing & Community

### Content Sharing
- **Social Media**: Share to Facebook, Twitter, Instagram
- **Messaging**: Send via SMS, WhatsApp, or email
- **Deep Links**: Shareable links that open directly in app
- **Custom Messages**: Add personal notes when sharing

### App Invitations
- **Invite Friends**: Send app invitations to friends and family
- **Invitation Tracking**: Monitor invitation acceptance
- **Referral System**: Track who you've invited to the app
- **Community Growth**: Help grow the church community

---

## 🛠️ Content Management Guide

*For Church Staff and Administrators*

### Adding New Sermons

#### 1. **Prepare Audio File**
- **Format**: MP3 or M4A recommended
- **Quality**: 128kbps minimum, 256kbps recommended
- **Duration**: Include accurate duration in seconds
- **File Size**: Optimize for mobile download (under 50MB recommended)

#### 2. **Create Thumbnail Image**
- **Dimensions**: 1200x630 pixels (2:1 ratio)
- **Format**: JPG or PNG
- **Content**: Sermon title, preacher name, or series branding
- **File Size**: Under 2MB for optimal loading

#### 3. **Upload to Supabase Storage**
```sql
-- Example: Upload audio file to storage bucket
-- Use Supabase dashboard or API to upload files
-- Note the public URL for the audio file
```

#### 4. **Add Sermon to Database**
```sql
INSERT INTO public.sermons (
    title,
    preacher,
    date,
    duration,
    audio_url,
    thumbnail_url,
    description,
    category_id,
    is_featured,
    is_published
) VALUES (
    'Sermon Title Here',
    'Pastor Name',
    '2024-01-15',
    3600, -- Duration in seconds (1 hour)
    'https://your-supabase-url/storage/v1/object/public/sermons/audio-file.mp3',
    'https://your-supabase-url/storage/v1/object/public/sermons/thumbnail.jpg',
    'Sermon description and key points...',
    'category-uuid-here', -- Optional category
    false, -- Featured status
    true   -- Published status
);
```

#### 5. **Add Tags (Optional)**
```sql
-- First, get or create tag IDs
INSERT INTO public.tags (name, description, color) 
VALUES ('Faith', 'Topics related to faith and belief', '#1976D2')
ON CONFLICT (name) DO NOTHING;

-- Then link sermon to tags
INSERT INTO public.sermon_tags (sermon_id, tag_id)
VALUES (
    'sermon-uuid-here',
    (SELECT id FROM public.tags WHERE name = 'Faith')
);
```

### Adding New Articles

#### 1. **Prepare Article Content**
- **Title**: Clear, descriptive title
- **Author**: Author name and credentials
- **Content**: Full article text with proper formatting
- **Excerpt**: 2-3 sentence summary for previews
- **Thumbnail**: Optional image for article preview

#### 2. **Add Article to Database**
```sql
INSERT INTO public.articles (
    title,
    author,
    content,
    excerpt,
    thumbnail_url,
    category_id,
    is_featured,
    is_published,
    published_at
) VALUES (
    'Article Title Here',
    'Author Name',
    'Full article content with proper formatting...',
    'Brief excerpt for preview...',
    'https://your-supabase-url/storage/v1/object/public/articles/thumbnail.jpg',
    'category-uuid-here', -- Optional category
    false, -- Featured status
    true,  -- Published status
    NOW()  -- Publication date
);
```

### Managing Categories

#### 1. **Create New Category**
```sql
INSERT INTO public.categories (
    name,
    description,
    color,
    icon,
    sort_order,
    is_active
) VALUES (
    'New Series',
    'Description of the new series',
    '#1976D2', -- Hex color code
    'book-series', -- Material icon name
    10, -- Sort order
    true -- Active status
);
```

#### 2. **Update Existing Category**
```sql
UPDATE public.categories 
SET 
    name = 'Updated Name',
    description = 'Updated description',
    color = '#FF5722',
    sort_order = 5
WHERE id = 'category-uuid-here';
```

### Content Quality Guidelines

#### Sermon Quality Standards
- **Audio Quality**: Clear, professional recording
- **Content**: Biblically sound, engaging delivery
- **Metadata**: Accurate title, preacher, date, and description
- **Thumbnails**: High-quality, relevant images
- **Organization**: Proper categorization and tagging

#### Article Quality Standards
- **Writing**: Well-written, grammatically correct content
- **Content**: Spiritually edifying and doctrinally sound
- **Formatting**: Proper paragraph breaks and structure
- **Length**: Appropriate length for mobile reading
- **Images**: High-quality, relevant thumbnails

### Content Publishing Workflow

#### 1. **Content Review**
- Review all content for accuracy and quality
- Check audio/video quality for sermons
- Proofread articles for grammar and content
- Verify all metadata is correct

#### 2. **Testing**
- Test audio playback on multiple devices
- Verify article formatting on mobile devices
- Check thumbnail images display correctly
- Test search functionality with new content

#### 3. **Publishing**
- Set `is_published = true` in database
- Consider featuring important content (`is_featured = true`)
- Send push notifications for new content
- Update website and social media

#### 4. **Monitoring**
- Track content views and downloads
- Monitor user engagement and feedback
- Analyze which content performs best
- Make adjustments based on analytics

---

## 📊 Analytics & Performance

### Key Metrics to Track

#### Content Performance
- **Views**: How many times content is accessed
- **Downloads**: Offline download statistics
- **Completion Rate**: How much of content is consumed
- **Share Rate**: How often content is shared

#### User Engagement
- **Daily/Monthly Active Users**: App usage patterns
- **Session Duration**: How long users spend in app
- **Feature Usage**: Which features are most popular
- **User Retention**: How many users return regularly

#### Content Analytics Queries
```sql
-- Top performing sermons
SELECT 
    title,
    preacher,
    views,
    downloads,
    ROUND((downloads::float / NULLIF(views, 0)) * 100, 2) as download_rate
FROM sermons 
WHERE is_published = true
ORDER BY views DESC
LIMIT 10;

-- Most popular categories
SELECT 
    c.name as category_name,
    COUNT(s.id) as sermon_count,
    COUNT(a.id) as article_count,
    SUM(s.views) as total_views
FROM categories c
LEFT JOIN sermons s ON c.id = s.category_id AND s.is_published = true
LEFT JOIN articles a ON c.id = a.category_id AND a.is_published = true
WHERE c.is_active = true
GROUP BY c.id, c.name
ORDER BY total_views DESC;
```

---

## 🔧 Technical Maintenance

### Regular Maintenance Tasks

#### Weekly Tasks
- **Content Updates**: Add new sermons and articles
- **Performance Monitoring**: Check app performance metrics
- **User Feedback**: Review and respond to user feedback
- **Backup Verification**: Ensure data backups are working

#### Monthly Tasks
- **Analytics Review**: Analyze usage patterns and trends
- **Content Audit**: Review and update existing content
- **Security Updates**: Update dependencies and security patches
- **Performance Optimization**: Optimize slow queries and features

#### Quarterly Tasks
- **Feature Planning**: Plan new features and improvements
- **User Research**: Conduct user surveys and feedback sessions
- **Technical Debt**: Address technical debt and code improvements
- **Content Strategy**: Review and update content strategy

### Troubleshooting Common Issues

#### Audio Playback Issues
- **Check File Format**: Ensure audio files are in supported formats
- **Verify URLs**: Confirm audio URLs are accessible
- **Test on Devices**: Test playback on various devices
- **Check Network**: Verify network connectivity and speed

#### Content Not Appearing
- **Check Published Status**: Ensure `is_published = true`
- **Verify Categories**: Check category is active
- **Review RLS Policies**: Ensure proper row-level security
- **Check Search Indexes**: Verify search functionality

#### Push Notification Issues
- **Database Schema**: Ensure `device_id` column exists in `push_tokens` table
- **Run Migration**: Execute the migration file `database/migrations/add_device_id_to_push_tokens.sql`
- **Check Permissions**: Verify RLS policies allow user access to push tokens
- **Token Storage**: Ensure push tokens are being stored correctly

#### User Account Issues
- **Email Verification**: Ensure users verify their email
- **Password Reset**: Provide password reset functionality
- **Account Recovery**: Help users recover locked accounts
- **Profile Updates**: Assist with profile management

---

## 🚀 Future Enhancements

### Planned Features
- **Live Streaming**: Stream church services live
- **Interactive Features**: Comments and discussions
- **Advanced Analytics**: Detailed user behavior tracking
- **Multi-language Support**: Support for multiple languages
- **Wearable Integration**: Apple Watch and Android Wear support

### Community Features
- **User Groups**: Create study groups and communities
- **Event Management**: Church event calendar and RSVP
- **Prayer Requests**: Submit and share prayer requests
- **Volunteer Management**: Sign up for church activities

---

## 📞 Support & Contact

### For Users
- **App Support**: Contact through app settings
- **Website**: Visit [truevinefellowship.online](https://truevinefellowship.online)
- **Email**: support@truevinefellowship.online
- **Phone**: Contact church office for assistance

### For Church Staff
- **Technical Support**: Contact development team
- **Content Management**: Training available for staff
- **Analytics Reports**: Monthly reports provided
- **Feature Requests**: Submit through development team

---

## 📋 Quick Reference

### Essential SQL Queries
```sql
-- Get all published sermons
SELECT * FROM sermons WHERE is_published = true ORDER BY date DESC;

-- Get all published articles
SELECT * FROM articles WHERE is_published = true ORDER BY published_at DESC;

-- Get user's saved content
SELECT * FROM user_content WHERE user_id = 'user-uuid' AND action_type = 'save';

-- Get content analytics
SELECT 
    content_type,
    COUNT(*) as total_views
FROM content_views 
WHERE view_date >= NOW() - INTERVAL '30 days'
GROUP BY content_type;
```

### App Configuration
- **Environment Variables**: Check `.env` file for proper configuration
- **Supabase Setup**: Ensure proper database and storage configuration
- **Push Notifications**: Verify notification service configuration
- **Deep Linking**: Test deep link functionality

### Content Best Practices
- **Consistent Naming**: Use consistent naming conventions
- **Quality Images**: Use high-quality, optimized images
- **SEO Optimization**: Include relevant keywords in titles and descriptions
- **Mobile Optimization**: Ensure content works well on mobile devices

---

**TRUEVINE FELLOWSHIP Church App** - Bringing the Word to your mobile device, fostering spiritual growth and community connection through technology.

*Last Updated: December 2024*
