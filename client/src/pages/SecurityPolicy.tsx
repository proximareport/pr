import React from 'react';
import { Helmet } from 'react-helmet-async';

const SecurityPolicy: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Security Policy - Proxima Report</title>
        <meta name="description" content="Security policy and vulnerability disclosure information for Proxima Report" />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-card rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold mb-6 text-foreground">Security Policy</h1>
          
          <div className="space-y-6 text-foreground">
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-foreground">Reporting Security Vulnerabilities</h2>
              <p className="mb-4 text-muted-foreground">
                We take security seriously at Proxima Report. If you discover a security vulnerability, 
                please report it to us responsibly.
              </p>
              
              <div className="mb-6">
                <h3 className="text-xl font-medium mb-3 text-foreground">How to Report</h3>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li><strong className="text-foreground">Email:</strong> security@proximareport.com</li>
                  <li><strong className="text-foreground">Contact Form:</strong> <a href="https://proximareport.com/contact" className="text-primary hover:underline">Contact Us</a></li>
                </ul>
              </div>
              
              <div className="mb-6">
                <h3 className="text-xl font-medium mb-3 text-foreground">What to Include</h3>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>Description of the vulnerability</li>
                  <li>Steps to reproduce the issue</li>
                  <li>Potential impact assessment</li>
                  <li>Any proof-of-concept code (if applicable)</li>
                </ul>
              </div>
              
              <div className="mb-6">
                <h3 className="text-xl font-medium mb-3 text-foreground">Our Commitment</h3>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>We will acknowledge receipt of your report within 48 hours</li>
                  <li>We will provide regular updates on our progress</li>
                  <li>We will work with you to understand and resolve the issue</li>
                  <li>We will credit you for responsible disclosure (unless you prefer to remain anonymous)</li>
                </ul>
              </div>
            </section>
            
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-foreground">Security Measures</h2>
              <p className="mb-4 text-muted-foreground">Proxima Report implements the following security measures:</p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>HTTPS encryption for all communications</li>
                <li>Secure session management</li>
                <li>Content Security Policy (CSP) headers</li>
                <li>Strict Transport Security (HSTS)</li>
                <li>Regular security updates and patches</li>
                <li>Secure coding practices</li>
                <li>Input validation and sanitization</li>
                <li>SQL injection prevention</li>
                <li>Cross-site scripting (XSS) protection</li>
              </ul>
            </section>
            
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-foreground">Data Protection</h2>
              <p className="mb-4 text-muted-foreground">
                We are committed to protecting user data and privacy. Our data protection measures include:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Encryption of sensitive data in transit and at rest</li>
                <li>Regular security audits</li>
                <li>Access controls and authentication</li>
                <li>Data minimization principles</li>
                <li>Secure data disposal procedures</li>
              </ul>
            </section>
            
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-foreground">Compliance</h2>
              <p className="mb-4 text-muted-foreground">
                Proxima Report is designed to meet high security standards suitable for government and 
                enterprise environments, including NASA network requirements.
              </p>
            </section>
            
            <div className="mt-8 p-4 bg-muted rounded-lg border">
              <p className="text-sm text-muted-foreground">
                <strong className="text-foreground">Last Updated:</strong> January 2025<br />
                <strong className="text-foreground">Next Review:</strong> July 2025
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecurityPolicy;
