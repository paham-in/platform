//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:json_annotation/json_annotation.dart';

part 'class_error_response.g.dart';


@JsonSerializable(
  checked: true,
  createToJson: true,
  disallowUnrecognizedKeys: false,
  explicitToJson: true,
)
class ClassErrorResponse {
  /// Returns a new [ClassErrorResponse] instance.
  ClassErrorResponse({

     this.error,
  });

  @JsonKey(
    
    name: r'error',
    required: false,
    includeIfNull: false,
  )


  final String? error;





    @override
    bool operator ==(Object other) => identical(this, other) || other is ClassErrorResponse &&
      other.error == error;

    @override
    int get hashCode =>
        error.hashCode;

  factory ClassErrorResponse.fromJson(Map<String, dynamic> json) => _$ClassErrorResponseFromJson(json);

  Map<String, dynamic> toJson() => _$ClassErrorResponseToJson(this);

  @override
  String toString() {
    return toJson().toString();
  }

}

