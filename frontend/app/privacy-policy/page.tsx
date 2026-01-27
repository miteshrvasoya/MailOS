import React from 'react'
import { Card } from '@/components/ui/card'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function PrivacyPolicyPage() {
  return (
    <div className="container max-w-4xl mx-auto py-12 px-4">
      <div className="mb-8">
        <Link href="/" className="flex items-center text-sm text-muted-foreground hover:text-primary transition-colors mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Link>
        <h1 className="text-4xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-muted-foreground">Last Updated: January 27, 2026</p>
      </div>

      <Card className="p-8 space-y-8">
        <section>
          <h2 className="text-2xl font-semibold mb-4 text-primary">1. Introduction</h2>
          <p className="text-muted-foreground leading-relaxed">
            Welcome to MailOS ("we", "our", or "us"). We are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, and safeguard your data when you use our intelligent email management service.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 text-primary">2. Google API Services Compliance</h2>
          <div className="space-y-4 text-muted-foreground leading-relaxed">
            <p className="font-medium text-foreground">
              MailOS complies with the Google API Services User Data Policy, including the Limited Use requirements.
            </p>
            <p>
              Our use and transfer to any other app of information received from Google APIs will adhere to <a href="https://developers.google.com/terms/api-services-user-data-policy#additional_requirements_for_specific_api_scopes" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Google API Services User Data Policy</a>, including the Limited Use requirements.
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li><strong>Read-Only Access:</strong> We request standard read access to your Gmail messages solely to categorize and organize them for your view. We do not store your email bodies permanently on our servers; we cache only essential metadata needed for processing.</li>
              <li><strong>Write Access (Optional):</strong> If you enable "Auto-Labeling", we request permission to modify your Gmail data (create labels, modify message labels) strictly to execute the organization actions you have authorized.</li>
              <li><strong>No Data Sale:</strong> We do not sell your personal data or email content to third parties.</li>
              <li><strong>No Advertising:</strong> We do not use your email data for advertising purposes.</li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 text-primary">3. Information We Collect</h2>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground leading-relaxed">
            <li><strong>Authentication Data:</strong> Google Profile information (Email, Name, Profile Picture) for account creation.</li>
            <li><strong>Email Metadata:</strong> Headers, subjects, sender information, and snippet previews for organization processing.</li>
            <li><strong>Usage Data:</strong> Anonymous analytics data (e.g., Google Analytics) to improve our service performance and user experience.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 text-primary">4. Data Security</h2>
          <p className="text-muted-foreground leading-relaxed">
            We implement industry-standard security measures to protect your data. Your OAuth tokens are encrypted at rest. We use secure HTTPS connections for all data transmission.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 text-primary">5. Your Rights</h2>
          <p className="text-muted-foreground leading-relaxed">
            You maintain full control over your data. You can:
          </p>
          <ul className="list-disc pl-6 space-y-2 mt-2 text-muted-foreground">
            <li>Review and delete your data via the Settings page.</li>
            <li>Revoke MailOS's access to your Google Account at any time via your <a href="https://myaccount.google.com/permissions" target="_blank" className="text-primary hover:underline">Google Security settings</a>.</li>
            <li>Request a full export of your data.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 text-primary">6. Contact Us</h2>
          <p className="text-muted-foreground leading-relaxed">
            If you have any questions about this Privacy Policy, please contact us at privacy@mailos.app.
          </p>
        </section>
      </Card>
      
      <div className="mt-8 text-center text-sm text-muted-foreground">
        &copy; {new Date().getFullYear()} MailOS. All rights reserved.
      </div>
    </div>
  )
}
