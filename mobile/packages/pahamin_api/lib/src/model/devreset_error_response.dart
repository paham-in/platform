//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:json_annotation/json_annotation.dart';

part 'devreset_error_response.g.dart';


@JsonSerializable(
  checked: true,
  createToJson: true,
  disallowUnrecognizedKeys: false,
  explicitToJson: true,
)
class DevresetErrorResponse {
  /// Returns a new [DevresetErrorResponse] instance.
  DevresetErrorResponse({

     this.error,
  });

  @JsonKey(
    
    name: r'error',
    required: false,
    includeIfNull: false,
  )


  final String? error;





    @override
    bool operator ==(Object other) => identical(this, other) || other is DevresetErrorResponse &&
      other.error == error;

    @override
    int get hashCode =>
        error.hashCode;

  factory DevresetErrorResponse.fromJson(Map<String, dynamic> json) => _$DevresetErrorResponseFromJson(json);

  Map<String, dynamic> toJson() => _$DevresetErrorResponseToJson(this);

  @override
  String toString() {
    return toJson().toString();
  }

}

