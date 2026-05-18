<?php

namespace App\Console\Commands;

use App\Models\Mhouse;
use App\Models\Payments;
use App\Models\Trhouse_residents;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class GenerateMonthlyCharges extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'charges:generate {--month=} {--year=} {--force}';

    /**
     * The description of the console command.
     *
     * @var string
     */
    protected $description = 'Generate monthly charges for active residents automatically. Run without arguments to generate for current month.';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        try {
            $month = (int) ($this->option('month') ?? now()->month);
            $year = (int) ($this->option('year') ?? now()->year);
            $force = $this->option('force');

            if (!$this->validateMonthYear($month, $year)) {
                $this->error('Invalid month (1-12) or year.');
                return self::FAILURE;
            }

            $this->info("Generating charges for {$month}/{$year}...");

            // Check if charges already exist for this month
            $existingCharges = Payments::query()
                ->where('month', $month)
                ->where('year', $year)
                ->count();

            if ($existingCharges > 0 && !$force) {
                $this->error("Charges for {$month}/{$year} already exist. Use --force to regenerate.");
                return self::FAILURE;
            }

            if ($existingCharges > 0 && $force) {
                $this->warn("Deleting existing charges for {$month}/{$year}...");
                Payments::query()
                    ->where('month', $month)
                    ->where('year', $year)
                    ->delete();
            }

            // Get all active residents (Tetap status)
            $activeResidents = Trhouse_residents::query()
                ->with(['resident', 'house'])
                ->where('is_active', true)
                ->whereNull('end_date')
                ->where(function ($query) {
                    $query->whereNull('resident.resident_status')
                        ->orWhere('resident.resident_status', 'Tetap');
                })
                ->join('Mresidents as r', 'r.id', '=', 'trhouse_residents.resident_id')
                ->select('trhouse_residents.*')
                ->get();

            if ($activeResidents->isEmpty()) {
                $this->warn('No active permanent residents found.');
                return self::SUCCESS;
            }

            // Fixed rates
            $rates = [
                'Satpam' => 100000,     // 100k
                'Kebersihan' => 15000,  // 15k
            ];

            $createdCount = 0;
            $chargeTypes = array_keys($rates);

            DB::transaction(function () use ($activeResidents, $month, $year, $rates, $chargeTypes, &$createdCount) {
                foreach ($activeResidents as $resident) {
                    foreach ($chargeTypes as $type) {
                        Payments::create([
                            'trhouse_resident_id' => $resident->id,
                            'amount' => $rates[$type],
                            'type' => $type,
                            'month' => $month,
                            'year' => $year,
                            'status' => 'Belum Bayar',
                            'paid_at' => null,
                        ]);
                        $createdCount++;
                    }
                }
            });

            $this->info("✓ Successfully generated {$createdCount} charge records for {$month}/{$year}");
            Log::channel('daily')->info("Generated {$createdCount} monthly charges for {$month}/{$year}");

            return self::SUCCESS;
        } catch (\Exception $e) {
            $this->error("Error: " . $e->getMessage());
            Log::channel('daily')->error("Monthly charge generation failed: " . $e->getMessage());
            return self::FAILURE;
        }
    }

    /**
     * Validate month and year
     */
    private function validateMonthYear(int $month, int $year): bool
    {
        return $month >= 1 && $month <= 12 && $year > 2000 && $year < 2100;
    }
}
