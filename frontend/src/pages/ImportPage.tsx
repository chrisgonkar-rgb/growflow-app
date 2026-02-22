// Growflow - CSV/Excel Import Page
// © TrueNorth Group of Companies Ltd.

import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Upload, 
  FileSpreadsheet, 
  CheckCircle, 
  AlertCircle,
  Download
} from 'lucide-react';
import { toast } from 'sonner';
import DB from '@/db';
import type { Customer, WasteType, Frequency } from '@/types';
import * as XLSX from 'xlsx';

interface ImportRow {
  full_name: string;
  phone: string;
  email: string;
  city: string;
  community: string;
  landmark: string;
  waste_type: string;
  frequency: string;
  agreed_amount_usd: string;
  agreed_amount_lrd?: string;
  start_date: string;
  status?: string;
  notes?: string;
}

interface ImportResult {
  row: number;
  success: boolean;
  error?: string;
  customer?: Customer;
}

export default function ImportPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<ImportResult[]>([]);
  const [showResults, setShowResults] = useState(false);

  const downloadTemplate = () => {
    const template = [
      {
        full_name: 'John Doe',
        phone: '0770123456',
        email: 'john.doe@example.com',
        city: 'Monrovia',
        community: 'Sinkor',
        landmark: 'Near the market',
        waste_type: 'household',
        frequency: 'weekly',
        agreed_amount_usd: '50',
        agreed_amount_lrd: '9000',
        start_date: '2024-01-01',
        status: 'active_payment_required',
        notes: 'VIP customer',
      }
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    XLSX.writeFile(wb, 'growflow_import_template.xlsx');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setResults([]);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet) as ImportRow[];

      const importResults: ImportResult[] = [];

      for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i];
        const rowNum = i + 2; // +2 because Excel rows start at 1 and we have a header

        // Validate required fields
        const requiredFields = ['full_name', 'phone', 'email', 'city', 'community', 'landmark', 'waste_type', 'frequency'];
        const missingFields = requiredFields.filter(f => !row[f as keyof ImportRow]);

        if (missingFields.length > 0) {
          importResults.push({
            row: rowNum,
            success: false,
            error: `Missing required fields: ${missingFields.join(', ')}`,
          });
          continue;
        }

        // Check for duplicate phone
        const existingCustomer = DB.Customer.getByPhone(row.phone);
        if (existingCustomer) {
          importResults.push({
            row: rowNum,
            success: false,
            error: `Phone number ${row.phone} already exists`,
          });
          continue;
        }

        // Validate waste type
        const validWasteTypes = ['household', 'mixed', 'business', 'construction'];
        if (!validWasteTypes.includes(row.waste_type.toLowerCase())) {
          importResults.push({
            row: rowNum,
            success: false,
            error: `Invalid waste_type: ${row.waste_type}. Must be one of: ${validWasteTypes.join(', ')}`,
          });
          continue;
        }

        // Validate frequency
        const validFrequencies = ['weekly', 'twice_weekly', 'special'];
        if (!validFrequencies.includes(row.frequency.toLowerCase())) {
          importResults.push({
            row: rowNum,
            success: false,
            error: `Invalid frequency: ${row.frequency}. Must be one of: ${validFrequencies.join(', ')}`,
          });
          continue;
        }

        // Create customer
        const customer: Customer = {
          id: uuidv4(),
          full_name: row.full_name,
          phone: row.phone,
          email: row.email.toLowerCase(),
          password_hash: DB.hashPassword('changeme123'), // Default password
          city: row.city,
          community: row.community,
          landmark: row.landmark,
          waste_type: row.waste_type.toLowerCase() as WasteType,
          frequency: row.frequency.toLowerCase().replace(' ', '_') as Frequency,
          status: (row.status as any) || 'pending_quote',
          created_at: new Date().toISOString(),
        };

        DB.Customer.create(customer);

        // Create subscription if amount is provided
        if (row.agreed_amount_usd) {
          const subscription = {
            id: uuidv4(),
            customer_id: customer.id,
            agreed_amount_usd: parseFloat(row.agreed_amount_usd),
            agreed_amount_lrd: row.agreed_amount_lrd ? parseFloat(row.agreed_amount_lrd) : undefined,
            start_date: row.start_date || new Date().toISOString().split('T')[0],
            set_by: 'import',
            set_at: new Date().toISOString(),
            notes: row.notes,
          };
          DB.Subscription.create(subscription);

          // Update customer status
          if (row.status === 'active_payment_required' || row.status === 'active_paid') {
            DB.Customer.update(customer.id, { status: row.status as any });
          }
        }

        importResults.push({
          row: rowNum,
          success: true,
          customer,
        });
      }

      setResults(importResults);
      setShowResults(true);

      const successCount = importResults.filter(r => r.success).length;
      toast.success(`Import completed: ${successCount} of ${importResults.length} records imported successfully`);
    } catch (error) {
      toast.error('Error processing file: ' + (error as Error).message);
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const successCount = results.filter(r => r.success).length;
  const failCount = results.filter(r => !r.success).length;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm py-4 px-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/admin')}
              className="mr-2"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Bulk Import</h1>
              <p className="text-xs text-gray-500">Import customers from CSV/Excel</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 py-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Instructions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <FileSpreadsheet className="h-5 w-5 mr-2" />
                Import Instructions
              </CardTitle>
              <CardDescription>
                Upload a CSV or Excel file with customer data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-2">Required Columns:</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• <strong>full_name</strong> - Customer's full name</li>
                  <li>• <strong>phone</strong> - Phone number (must be unique)</li>
                  <li>• <strong>email</strong> - Email address (must be unique)</li>
                  <li>• <strong>city</strong> - City name</li>
                  <li>• <strong>community</strong> - Community/area</li>
                  <li>• <strong>landmark</strong> - Landmark description</li>
                  <li>• <strong>waste_type</strong> - household, mixed, business, or construction</li>
                  <li>• <strong>frequency</strong> - weekly, twice_weekly, or special</li>
                </ul>
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-medium text-green-800 mb-2">Optional Columns:</h4>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>• <strong>agreed_amount_usd</strong> - Monthly fee in USD</li>
                  <li>• <strong>agreed_amount_lrd</strong> - Monthly fee in LRD</li>
                  <li>• <strong>start_date</strong> - Subscription start date (YYYY-MM-DD)</li>
                  <li>• <strong>status</strong> - pending_quote, active_payment_required, or active_paid</li>
                  <li>• <strong>notes</strong> - Any additional notes</li>
                </ul>
              </div>

              <Button 
                onClick={downloadTemplate}
                variant="outline"
                className="w-full"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Template
              </Button>
            </CardContent>
          </Card>

          {/* Upload Area */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Upload File</CardTitle>
            </CardHeader>
            <CardContent>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".csv,.xlsx,.xls"
                className="hidden"
              />
              <div 
                onClick={() => !isProcessing && fileInputRef.current?.click()}
                className={`border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  isProcessing ? 'opacity-50 cursor-not-allowed' : 'hover:border-green-500 hover:bg-green-50'
                }`}
              >
                {isProcessing ? (
                  <div className="flex flex-col items-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mb-2"></div>
                    <p className="text-gray-600">Processing file...</p>
                  </div>
                ) : (
                  <>
                    <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600 font-medium">Click to upload CSV or Excel file</p>
                    <p className="text-sm text-gray-400 mt-1">Supported formats: .csv, .xlsx, .xls</p>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          {showResults && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  <span>Import Results</span>
                  <div className="flex gap-2">
                    <Badge className="bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      {successCount} Success
                    </Badge>
                    <Badge className="bg-red-100 text-red-800">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {failCount} Failed
                    </Badge>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-h-96 overflow-y-auto space-y-2">
                  {results.map((result, index) => (
                    <div 
                      key={index}
                      className={`p-3 rounded-lg ${
                        result.success ? 'bg-green-50' : 'bg-red-50'
                      }`}
                    >
                      <div className="flex items-start">
                        {result.success ? (
                          <CheckCircle className="h-5 w-5 text-green-600 mr-2 mt-0.5" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-red-600 mr-2 mt-0.5" />
                        )}
                        <div>
                          <p className="font-medium text-sm">
                            Row {result.row}: {result.success ? 'Success' : 'Failed'}
                          </p>
                          {result.success && result.customer && (
                            <p className="text-sm text-green-700">
                              {result.customer.full_name} ({result.customer.phone})
                            </p>
                          )}
                          {!result.success && result.error && (
                            <p className="text-sm text-red-700">{result.error}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white py-4 px-4 text-center">
        <p className="text-xs text-gray-500">
          © TrueNorth Group of Companies Ltd. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
