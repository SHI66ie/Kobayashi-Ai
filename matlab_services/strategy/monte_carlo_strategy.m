function results = monte_carlo_strategy(num_laps, track_temp, base_lap_time, fuel_effect, pit_stop_loss, num_simulations)
    % MONTE_CARLO_STRATEGY Runs parallel Monte Carlo sweeps to find optimal strategy.
    %
    % num_laps: total race laps (e.g. 50)
    % track_temp: average track temp (e.g. 35.0)
    % base_lap_time: car base pace in seconds (e.g. 95.0)
    % fuel_effect: weight penalty per kg of fuel (e.g. 0.05s)
    % pit_stop_loss: time cost for a pit stop in seconds (e.g. 22.0)
    % num_simulations: number of randomized scenarios per strategy (e.g. 1000)

    if nargin < 6
        num_simulations = 50000;
    end

    % We will sweep pit stop laps.
    % Strategy: 1-Stop strategy. Pit on lap `pit_lap`.
    % We will sweep `pit_lap` from 5 to `num_laps - 5`.
    sweep_laps = 5:(num_laps - 5);
    num_strategies = length(sweep_laps);
    
    mean_race_times = zeros(1, num_strategies);
    wreck_risk_impacts = zeros(1, num_strategies);

    % Use parallel processing (parfor) to simulate strategies
    parfor s = 1:num_strategies
        pit_lap = sweep_laps(s);
        total_times = zeros(1, num_simulations);
        
        for sim = 1:num_simulations
            race_time = 0;
            fuel = 100.0; % Start with full fuel
            
            % Wreck probability per lap
            wreck_probability = 0.015;
            sc_active = false;
            sc_duration = 0;
            
            for lap = 1:num_laps
                % Fuel burns off: 1.8 kg per lap
                fuel = max(0, fuel - 1.8);
                
                % Wreck trigger
                if ~sc_active && rand() < wreck_probability
                    sc_active = true;
                    sc_duration = randsample(3:5, 1); % SC duration of 3 to 5 laps
                end
                
                % Standard pace
                lap_pace = base_lap_time + (fuel * fuel_effect);
                
                % Pit stop overhead
                if lap == pit_lap
                    % Pit stop human error margin: normal dist around 2.8s, + standard pit lane loss
                    pit_error = 2.8 + randn() * 0.4;
                    if pit_error < 2.0; pit_error = 2.0; end
                    race_time = race_time + pit_stop_loss + pit_error;
                    fuel = 50.0; % Refuel to 50% capacity (GR Cup setup)
                end
                
                % Safety Car pacing slows down lap times
                if sc_active && sc_duration > 0
                    lap_pace = lap_pace * 1.4; % 40% slower under SC
                    sc_duration = sc_duration - 1;
                    if sc_duration == 0
                        sc_active = false;
                    end
                end
                
                race_time = race_time + lap_pace;
            end
            total_times(sim) = race_time;
        end
        mean_race_times(s) = mean(total_times);
        wreck_risk_impacts(s) = std(total_times);
    end

    % Format output struct
    results = struct();
    results.sweep_laps = sweep_laps;
    results.mean_race_times = mean_race_times;
    results.risk_std = wreck_risk_impacts;
    
    [best_time, best_idx] = min(mean_race_times);
    results.optimal_pit_lap = sweep_laps(best_idx);
    results.optimal_race_time = best_time;
end
