//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:json_annotation/json_annotation.dart';

part 'program_error_response.g.dart';


@JsonSerializable(
  checked: true,
  createToJson: true,
  disallowUnrecognizedKeys: false,
  explicitToJson: true,
)
class ProgramErrorResponse {
  /// Returns a new [ProgramErrorResponse] instance.
  ProgramErrorResponse({

     this.error,
  });

  @JsonKey(
    
    name: r'error',
    required: false,
    includeIfNull: false,
  )


  final String? error;





    @override
    bool operator ==(Object other) => identical(this, other) || other is ProgramErrorResponse &&
      other.error == error;

    @override
    int get hashCode =>
        error.hashCode;

  factory ProgramErrorResponse.fromJson(Map<String, dynamic> json) => _$ProgramErrorResponseFromJson(json);

  Map<String, dynamic> toJson() => _$ProgramErrorResponseToJson(this);

  @override
  String toString() {
    return toJson().toString();
  }

}

