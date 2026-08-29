//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:json_annotation/json_annotation.dart';

part 'setting_error_response.g.dart';


@JsonSerializable(
  checked: true,
  createToJson: true,
  disallowUnrecognizedKeys: false,
  explicitToJson: true,
)
class SettingErrorResponse {
  /// Returns a new [SettingErrorResponse] instance.
  SettingErrorResponse({

     this.error,
  });

  @JsonKey(
    
    name: r'error',
    required: false,
    includeIfNull: false,
  )


  final String? error;





    @override
    bool operator ==(Object other) => identical(this, other) || other is SettingErrorResponse &&
      other.error == error;

    @override
    int get hashCode =>
        error.hashCode;

  factory SettingErrorResponse.fromJson(Map<String, dynamic> json) => _$SettingErrorResponseFromJson(json);

  Map<String, dynamic> toJson() => _$SettingErrorResponseToJson(this);

  @override
  String toString() {
    return toJson().toString();
  }

}

