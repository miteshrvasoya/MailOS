import { Header } from '@/components/header'

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <Header />
      
      <div className="max-w-4xl mx-auto px-6 py-12 md:py-20">
        <h1 className="text-4xl md:text-5xl font-bold mb-8">Privacy Policy</h1>
        <p className="text-muted-foreground mb-12 text-lg">
          Last updated: February 14, 2026
        </p>

        <div className="prose prose-stone dark:prose-invert max-w-none space-y-12">
          
          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
            <p className="text-muted-foreground leading-relaxed">
              MailOS ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclosure, and safeguard your information when you use our website and email intelligence service. By accessing or using MailOS, you agree to the terms of this Privacy Policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">2. Information We Collect</h2>
            <div className="space-y-4 text-muted-foreground">
              <p>We collect information you provide directly to us when you create an account or use our services:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Account Information:</strong> Your name, email address, and profile picture provided via Google Sign-In.</li>
                <li><strong>Email Metadata & Content:</strong> We access your Gmail messages solely to provide our core features (classification, summarization, and organization). We retrieve email headers (sender, subject, date) and body content.</li>
                <li><strong>Usage Data:</strong> Information about how you interact with our service, such as features used and time spent.</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. How We Use Your Information</h2>
            <div className="space-y-4 text-muted-foreground">
              <p>We use the information we collect to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Provide, maintain, and improve our services.</li>
                <li>Process and analyze your emails to generate insights, summaries, and classifications.</li>
                <li>Send you daily digests and notifications as per your preferences.</li>
                <li>Detect, prevent, and address technical issues or security threats.</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. AI Processing</h2>
            <p className="text-muted-foreground leading-relaxed">
              MailOS utilizes Artificial Intelligence (AI) from third-party providers (OpenRouter, OpenAI, etc.) to analyze email content. 
              <strong>Your email data is sent to these providers solely for processing your requests. We do not use your data to train our own models, nor do we allow third-party providers to use your data for training their models.</strong>
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Google API Services Compliance</h2>
            <div className="bg-secondary/50 p-6 rounded-lg border border-border">
              <p className="text-muted-foreground leading-relaxed mb-4">
                MailOS's use and transfer to any other app of information received from Google APIs will adhere to the <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Google API Services User Data Policy</a>, including the Limited Use requirements.
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground text-sm">
                <li>We do not transfer your data to third parties unless necessary to provide or improve these features, comply with usage laws, or as part of a merger/acquisition.</li>
                <li>We do not use your data for advertisements.</li>
                <li>We do not allow humans to read your data unless we have your affirmative agreement for specific messages, for security purposes, or to comply with applicable laws.</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Data Security</h2>
            <p className="text-muted-foreground leading-relaxed">
              We implement industry-standard security measures to protect your data. Your OAuth tokens are encrypted at rest. All data transmission occurs over secure SSL/TLS connections. However, no method of transmission over the Internet is 100% secure, so we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Data Retention</h2>
            <p className="text-muted-foreground leading-relaxed">
              We retain your data only as long as necessary to provide our services. You may request deletion of your account and all associated data at any time by contacting us or using the delete account feature in Settings.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">8. Contact Us</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have any questions about this Privacy Policy, please contact us at: <a href="mailto:privacy@mailos.ai" className="text-primary hover:underline">privacy@mailos.ai</a>
            </p>
          </section>

        </div>
      </div>

      <footer className="border-t border-border bg-card py-12 mt-12">
        <div className="max-w-7xl mx-auto px-6 text-center text-sm text-muted-foreground">
          <p>&copy; 2026 MailOS. All rights reserved.</p>
        </div>
      </footer>
    </main>
  )
}
