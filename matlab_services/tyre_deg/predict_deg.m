function grip = predict_deg(compound, track_temp, lap, fuel_load, safety_car_laps)
    % PREDICT_DEG Calculates tyre degradation and grip levels.
    %
    % compound: 'Soft', 'Medium', or 'Hard'
    % track_temp: track temperature in Celsius (e.g. 42.5)
    % lap: current lap number (e.g. 14)
    % fuel_load: current fuel load in kg (e.g. 80.0, optional, defaults to 50)
    % safety_car_laps: array of laps when Safety Car was active (e.g. [10, 11], optional)

    if nargin < 4 || isempty(fuel_load)
        fuel_load = 50.0;
    end
    if nargin < 5 || isempty(safety_car_laps)
        safety_car_laps = [];
    end

    % Base characteristics by compound
    switch lower(compound)
        % compound: [base_grip, decay_rate, temp_sensitivity]
        case 'soft'
            base_grip = 1.0;
            decay_rate = 0.045;
            temp_sensitivity = 0.015;
            optimum_temp = 90.0; % Optimum tyre operating temp in C
        case 'medium'
            base_grip = 0.88;
            decay_rate = 0.025;
            temp_sensitivity = 0.009;
            optimum_temp = 95.0;
        case 'hard'
            base_grip = 0.78;
            decay_rate = 0.012;
            temp_sensitivity = 0.005;
            optimum_temp = 100.0;
        otherwise
            base_grip = 0.85;
            decay_rate = 0.025;
            temp_sensitivity = 0.010;
            optimum_temp = 95.0;
    end

    % Thermal model
    % Base carcass temperature is track temp + heating due to fuel and age
    carcass_temp = track_temp * 1.5 + (fuel_load * 0.15) + (lap * 0.5);

    % Safety Car cooling effect
    sc_active = false;
    sc_cooldown = 0;
    for i = 1:length(safety_car_laps)
        if lap >= safety_car_laps(i)
            % Cooling drops carcass temp by 12 degrees C per lap under SC
            sc_cooldown = sc_cooldown + 12.0 * exp(-0.2 * (lap - safety_car_laps(i)));
            sc_active = true;
        end
    end
    carcass_temp = carcass_temp - sc_cooldown;

    % Limit minimum carcass temp to track temperature
    if carcass_temp < track_temp
        carcass_temp = track_temp;
    end

    % Thermal grip penalty (non-linear parabolic curve around optimum temp)
    thermal_penalty = temp_sensitivity * ((carcass_temp - optimum_temp) / optimum_temp) ^ 2;

    % Degradation model: Exponential decay based on lap age, fuel load, and thermal stress
    % Heavy fuel load accelerates mechanical wear
    wear_factor = 1.0 + (fuel_load * 0.005);
    % If safety car was active, mechanical wear is reduced for those laps
    if sc_active
        wear_factor = wear_factor * 0.4;
    end
    
    decay = exp(-decay_rate * wear_factor * lap);
    
    % Combine base grip, mechanical decay, and thermal penalty
    grip = base_grip * decay - thermal_penalty;
    
    % Clamp grip between 0 and 1
    if grip < 0
        grip = 0.0;
    elseif grip > 1
        grip = 1.0;
    end
end
