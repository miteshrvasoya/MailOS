import React from 'react'
import { Card } from '@/components/ui/card'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function TermsPage() {
  return (
    <div className="container max-w-4xl mx-auto py-12 px-4">
      <div className="mb-8">
        <Link href="/" className="flex items-center text-sm text-muted-foreground hover:text-primary transition-colors mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Link>
        <h1 className="text-4xl font-bold mb-2">Terms and Conditions</h1>
        <p className="text-muted-foreground">Last Updated: January 27, 2026</p>
      </div>

      <Card className="p-8 space-y-8">
        <section>
          <h2 className="text-2xl font-semibold mb-4 text-primary">1. Agreement to Terms</h2>
          <p className="text-muted-foreground leading-relaxed">
            By accessing or using the MailOS website and services, you agree to be bound by these Terms and Conditions. If you disagree with any part of these terms, you may not access the service.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 text-primary">2. Use of Service</h2>
          <div className="space-y-4 text-muted-foreground leading-relaxed">
            <p>
              MailOS provides an intelligent email organization service connecting to your Gmail account. You agree to use the service only for lawful purposes and in accordance with these Terms.
            </p>
            <p className="font-medium">You agree not to:</p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>Use the service in any way that violates applicable laws or regulations.</li>
              <li>Attempt to reverse engineer or compromise the security of the application.</li>
              <li>Use the service to transmit spam or malicious content.</li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 text-primary">3. Intellectual Property</h2>
          <p className="text-muted-foreground leading-relaxed">
            The Service and its original content, features, and functionality are and will remain the exclusive property of MailOS and its licensors.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 text-primary">4. Accounts</h2>
          <p className="text-muted-foreground leading-relaxed">
            When you create an account with us, you must provide strictly accurate information. You are responsible for safeguarding the password and access tokens used to access the service.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 text-primary">5. Termination</h2>
          <p className="text-muted-foreground leading-relaxed">
            We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms. Upon termination, your right to use the Service will cease immediately.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 text-primary">6. Limitation of Liability</h2>
          <p className="text-muted-foreground leading-relaxed">
            In no event shall MailOS, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the Service.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 text-primary">7. Changes</h2>
          <p className="text-muted-foreground leading-relaxed">
            We reserve the right, at our sole discretion, to modify or replace these Terms at any time. By continuing to access or use our Service after those revisions become effective, you agree to be bound by the revised terms.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 text-primary">8. Contact Us</h2>
          <p className="text-muted-foreground leading-relaxed">
            If you have any questions about these Terms, please contact us at legal@mailos.app.
          </p>
        </section>
      </Card>
      
      <div className="mt-8 text-center text-sm text-muted-foreground">
        &copy; {new Date().getFullYear()} MailOS. All rights reserved.
      </div>
    </div>
  )
}
